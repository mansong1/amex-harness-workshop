import { Component, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { ApiserviceService } from '../_services/apiservice.service';
import {
  SERIES_COLORS, Sample, Summary, bucketise, buildLabel, splitVerdict, summarise, tierFromResponse,
} from './distribution.model';

/**
 * Distribution Test: sends synthetic POST /deploy/create requests and shows which
 * backend tier (stable vs canary) answered each one, so attendees can watch the
 * canary traffic split live during Lab 5.
 */
@Component({
  selector: 'app-distribution',
  standalone: true,
  imports: [NgxChartsModule, FormsModule],
  templateUrl: './distribution.component.html',
  styleUrl: './distribution.component.css',
})
export class DistributionComponent implements OnDestroy {
  /** Requests sent per second while the test runs. */
  readonly ratePerSecond = 4;
  /** Auto-stop so a forgotten tab doesn't hammer the backend. */
  readonly maxDurationMs = 10 * 60 * 1000;
  readonly windowSeconds = 60;
  readonly colors = SERIES_COLORS;

  /** Expected canary share in %. Default Canary step = 1 canary pod next to 3 stable pods. */
  expectedCanaryPct = 25;

  samples: Sample[] = [];
  summary: Summary = summarise([]);
  chartData: any[] = [];
  running = false;
  lastError = '';
  latestBuild: { canary?: string; stable?: string } = {};

  private tickId: any = null;
  private stopId: any = null;

  constructor(private apiService: ApiserviceService) {}

  get recent(): Sample[] {
    return this.samples.slice(-40).reverse();
  }

  get hasResponses(): boolean {
    return this.summary.canary + this.summary.stable > 0;
  }

  get verdict() {
    return splitVerdict(this.summary.canaryPct, this.expectedCanaryPct, this.summary.canary + this.summary.stable);
  }

  get backendUnreachable(): boolean {
    return this.summary.errors > 0 && this.summary.canary + this.summary.stable === 0;
  }

  build(version?: string): string {
    return buildLabel(version);
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.tickId = setInterval(() => this.sendOne(), 1000 / this.ratePerSecond);
    this.stopId = setTimeout(() => this.stop(), this.maxDurationMs);
    this.sendOne();
  }

  /** Kept for backwards compatibility with the old template/handlers. */
  run(): void {
    this.start();
  }

  stop(): void {
    this.running = false;
    if (this.tickId) clearInterval(this.tickId);
    if (this.stopId) clearTimeout(this.stopId);
    this.tickId = this.stopId = null;
  }

  reset(): void {
    this.samples = [];
    this.lastError = '';
    this.latestBuild = {};
    this.recompute();
  }

  ngOnDestroy(): void {
    this.stop();
  }

  /** Record one response (or failure). Public so specs can feed data without HTTP. */
  record(body: any, failed = false, at = Date.now()): void {
    const sample: Sample = failed
      ? { t: at, tier: 'error' }
      : { t: at, tier: tierFromResponse(body), version: body?.application_version || '', pod: body?.pod || '' };
    if (sample.tier !== 'error' && sample.version) {
      this.latestBuild = { ...this.latestBuild, [sample.tier]: sample.version };
    }
    this.samples.push(sample);
    // Keep memory bounded: 10 minutes at 4 req/s is 2400 samples.
    if (this.samples.length > 5000) this.samples.splice(0, this.samples.length - 5000);
    this.recompute();
  }

  private sendOne(): void {
    // The backend decides the tier from its own pod name; the posted name is ignored.
    this.apiService.generateEntry('normal').subscribe({
      next: (body) => this.record(body),
      error: (err) => {
        this.lastError = err?.status ? `HTTP ${err.status}` : 'network error';
        this.record(null, true);
      },
    });
  }

  private recompute(): void {
    this.summary = summarise(this.samples);
    this.chartData = bucketise(this.samples, 5000, this.windowSeconds / 5);
  }
}
