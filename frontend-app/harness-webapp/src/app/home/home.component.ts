import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ApiserviceService } from '../_services/apiservice.service';
import { HarnessFfService } from '../harness-ff.service';
import { buildLabel } from '../distribution/distribution.model';

/** Clearly fictional sample account data for the workshop demo app. */
export const SAMPLE_ACCOUNT = {
  balance: 1284.56,
  creditLimit: 10000,
  minimumDue: 35,
  dueDate: '2026-11-28',
  points: 24310,
  transactions: [
    { date: '2026-11-04', merchant: 'Corner Coffee Co.', category: 'Dining', amount: 6.75 },
    { date: '2026-11-03', merchant: 'Northwind Outfitters', category: 'Shopping', amount: 129.0 },
    { date: '2026-11-02', merchant: 'Metro Transit', category: 'Travel', amount: 42.5 },
    { date: '2026-11-01', merchant: 'Fresh Fields Market', category: 'Groceries', amount: 87.12 },
    { date: '2026-10-30', merchant: 'Bookshop on Main', category: 'Shopping', amount: 31.48 },
  ],
};

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {

  constructor(private router: Router, private apiService: ApiserviceService, private ffService: HarnessFfService) { }

  readonly account = SAMPLE_ACCOUNT;

  // Release facts: empty until the backend reports them; never faked.
  serviceName = '';
  lastExecution = '';
  executionUrl = '';
  applicationVersion = '';
  deploymentType = '';
  isCanary = false;

  member: any = null;
  orders: any[] = [];
  ordersDegraded = false;
  ordersChecked = false;
  ordersError = '';
  healthStatus = 'checking';
  payNote = false;

  ngOnInit(): void {
    this.refreshExecutionDetails();
    this.refreshMember();
    this.pollOrders();
    this.refreshHealth();
  }

  get availableCredit(): number {
    return this.account.creditLimit - this.account.balance;
  }

  get greeting(): string {
    const h = new Date().getHours();
    return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
  }

  get firstName(): string {
    return this.member?.first_name || 'Alex';
  }

  get memberName(): string {
    if (!this.member) {
      return 'Alex Member';
    }
    return `${this.member.first_name || ''} ${this.member.last_name || ''}`.trim() || 'Alex Member';
  }

  get hasRewardsTier(): boolean {
    return !!(this.member && this.member.rewards_tier);
  }

  get buildName(): string {
    return buildLabel(this.applicationVersion);
  }

  /** '101' / 'exec-101' -> 'Harness execution #101'; 'unknown' when not set. */
  get executionLabel(): string {
    const raw = (this.lastExecution || '').toString().trim();
    if (!raw) return 'Harness execution unknown';
    const m = raw.match(/(\d+)$/);
    return m ? `Harness execution #${m[1]}` : `Harness execution ${raw}`;
  }

  get healthLevel(): 'ok' | 'bad' | 'pending' {
    if (this.ordersDegraded || this.healthStatus === 'degraded' || this.healthStatus === 'unreachable') return 'bad';
    return this.healthStatus === 'ok' ? 'ok' : 'pending';
  }

  get healthLabel(): string {
    if (this.ordersDegraded) return 'Failing · smoke test';
    switch (this.healthStatus) {
      case 'ok': return 'Healthy';
      case 'degraded': return 'Degraded';
      case 'unreachable': return 'Unreachable';
      default: return 'Checking…';
    }
  }

  get releaseState(): string {
    if (this.ordersDegraded) return this.isCanary ? 'Rolling back' : 'Failing';
    return this.healthLabel;
  }

  refreshExecutionDetails(){
    this.apiService.getDetails()
    .subscribe({
      next: (data) => {
        this.serviceName = data.service_name || '';
        this.lastExecution = data.last_execution_id || '';
        this.executionUrl = data.execution_url || '';
        this.applicationVersion = data.application_version || '';
        this.deploymentType = data.deployment_type || '';
        this.isCanary = data.deployment_type === 'canary';
      },
      error: () => {
        // Leave everything unknown rather than inventing values.
      }
    });
  }

  refreshMember(){
    this.apiService.getMember()
    .subscribe({
      next: (data) => { this.member = data; },
      error: () => { this.member = null; }
    });
  }

  refreshHealth(){
    this.apiService.getHealth()
    .subscribe({
      next: (data) => {
        this.healthStatus = data?.status === 'ok' ? 'ok' : 'degraded';
      },
      error: () => { this.healthStatus = 'unreachable'; }
    });
  }

  pollOrders(){
    this.apiService.getOrders()
    .subscribe({
      next: (data) => {
        this.orders = Array.isArray(data?.orders) ? data.orders : [];
        this.ordersDegraded = false; this.ordersChecked = true;
      },
      error: (err) => {
        this.orders = [];
        this.ordersError = err?.status ? `HTTP ${err.status}` : 'network error';
        this.ordersDegraded = true; this.ordersChecked = true;
      }
    });
  }

  pay(){
    this.payNote = true;
  }

  distribution(){
    this.router.navigateByUrl('/distribution')
  }

  checkValue(){
    return this.ffService.variationFF() == "true";
  }

  changeGroup(){
    this.ffService.checkCycle("Beta")
  }

  checkRelase(){
    this.apiService.checkRelease()
    .subscribe((data) => {
      this.isCanary = data.deployment_type == 'canary';
      this.deploymentType = data.deployment_type || '';
    });
  }

}
