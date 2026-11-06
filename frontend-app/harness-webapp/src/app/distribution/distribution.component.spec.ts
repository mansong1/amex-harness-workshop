import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { DistributionComponent } from './distribution.component';
import { bucketise, buildLabel, splitVerdict, summarise, tierFromResponse } from './distribution.model';

describe('DistributionComponent', () => {
  let component: DistributionComponent;
  let fixture: ComponentFixture<DistributionComponent>;
  let el: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DistributionComponent, NoopAnimationsModule],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(DistributionComponent);
    component = fixture.componentInstance;
    el = fixture.nativeElement;
    fixture.detectChanges();
  });

  afterEach(() => component.stop());

  it('shows an empty state with instructions before any traffic', () => {
    expect(el.querySelector('.empty__title')?.textContent).toContain('Press Start test');
    expect(el.querySelector('ngx-charts-bar-vertical-stacked')).toBeNull();
    expect(el.querySelector('.total--errors .total__pct')?.textContent).toContain('—');
    expect(el.querySelector('.split__target')?.textContent).toContain('Compare against');
    expect(el.querySelector('.split__target')?.textContent).toContain("doesn't change routing");
  });

  it('turns the Errors card red once a request fails', () => {
    component.record({ name: 'normal' });
    component.record(null, true);
    fixture.detectChanges();
    expect(el.querySelector('.total--errors-active .total__pct')?.textContent).toContain('1');
  });

  it('has labelled Start test and Reset buttons', () => {
    const labels = Array.from(el.querySelectorAll('button')).map((b) => b.textContent?.trim());
    expect(labels).toContain('Start test');
    expect(labels).toContain('Reset');
  });

  it('counts stable vs canary responses and shows the observed split', () => {
    const t0 = Date.now();
    for (let i = 0; i < 90; i++) component.record({ name: 'normal', application_version: '42' }, false, t0 + i * 250);
    for (let i = 0; i < 10; i++) component.record({ name: 'canary', application_version: '43' }, false, t0 + i * 250);
    fixture.detectChanges();

    expect(component.summary.canaryPct).toBe(10);
    expect(component.summary.stablePct).toBe(90);
    expect(el.querySelector('.total--canary .total__pct')?.textContent).toContain('10%');
    expect(el.querySelector('.total--canary .total__meta')?.textContent).toContain('build-43');
    expect(el.querySelector('.total--stable .total__meta')?.textContent).toContain('build-42');
    expect(el.querySelector('.empty')).toBeNull();
    expect(el.textContent).not.toContain('normal');
  });

  it('flags an unreachable backend when every request fails', () => {
    component.record(null, true);
    component.lastError = 'network error';
    fixture.detectChanges();
    expect(component.summary.errors).toBe(1);
    expect(el.querySelector('.notice')?.textContent).toContain('certificate');
  });

  it('reset clears all counters', () => {
    component.record({ name: 'canary' });
    component.reset();
    fixture.detectChanges();
    expect(component.summary.total).toBe(0);
    expect(el.querySelector('.empty')).not.toBeNull();
  });
});

describe('distribution model', () => {
  it('maps backend names to tiers', () => {
    expect(tierFromResponse({ name: 'canary' })).toBe('canary');
    expect(tierFromResponse({ name: 'normal' })).toBe('stable');
    expect(tierFromResponse({ deployment_type: 'canary', name: 'normal' })).toBe('canary');
  });

  it('summarises with errors excluded from the split', () => {
    const s = summarise([
      { t: 0, tier: 'stable' }, { t: 0, tier: 'stable' }, { t: 0, tier: 'stable' },
      { t: 0, tier: 'canary' }, { t: 0, tier: 'error' },
    ]);
    expect(s.canaryPct).toBe(25);
    expect(s.errorPct).toBe(20);
  });

  it('buckets into requests per second and keeps empty buckets', () => {
    const samples = [{ t: 0, tier: 'stable' as const }, { t: 0, tier: 'canary' as const }, { t: 12_000, tier: 'stable' as const }];
    const data = bucketise(samples, 5000, 12, 16_000);
    expect(data.length).toBe(3);
    expect(data[0].series.find((x: any) => x.name === 'Stable')!.value).toBe(0.2);
    expect(data[1].series.every((x: any) => x.value === 0)).toBeTrue();
  });

  it('leaves out the bucket that is still filling', () => {
    const samples = [{ t: 0, tier: 'stable' as const }, { t: 12_000, tier: 'canary' as const }];
    expect(bucketise(samples, 5000, 12, 12_500).length).toBe(2);
    expect(bucketise([{ t: 1000, tier: 'stable' as const }], 5000, 12, 2000).length).toBe(0);
  });

  it('labels builds and judges the split', () => {
    expect(buildLabel('43')).toBe('build-43');
    expect(buildLabel('build-43')).toBe('build-43');
    expect(splitVerdict(9.6, 10, 100)).toBe('on-target');
    expect(splitVerdict(30, 10, 100)).toBe('off-target');
    expect(splitVerdict(30, 10, 5)).toBe('waiting');
  });
});
