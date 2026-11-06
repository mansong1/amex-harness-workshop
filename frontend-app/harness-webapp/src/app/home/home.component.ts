import { Component } from '@angular/core';

import { Router } from '@angular/router';
import { ApiserviceService } from '../_services/apiservice.service';
import { HarnessFfService } from '../harness-ff.service';
import { HarnessOfferComponent } from '../harness-offer/harness-offer.component';
import { CommonModule } from '@angular/common';
import { buildLabel } from '../distribution/distribution.model';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [ HarnessOfferComponent, CommonModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {

  constructor(private router: Router, private apiService: ApiserviceService, private ffService: HarnessFfService) { }

  serviceName= "Harness Webinar"
  productDeveloper= "Nikp"
  deploymentStatus="Complete"
  lastExecution="12.3"
  deploymentType="normal"
  applicationVersion="v1.0"
  executionDetails=""
  placeholder=" "
  isCanary:boolean = false
  isModalOpen = false;
  member: any = null;
  ordersDegraded = false;
  ordersChecked = false;
  healthStatus = 'checking';

  ngOnInit(): void {
    this.refreshExecutionDetails();
    this.refreshMember();
    this.pollOrders();
    this.refreshHealth();
  }

  get memberName(): string {
    if (!this.member) {
      return 'Alex Member';
    }
    return `${this.member.first_name || ''} ${this.member.last_name || ''}`.trim() || 'Alex Member';
  }

  get buildName(): string {
    return buildLabel(this.applicationVersion);
  }

  /** 'exec-101' / '101' -> 'Harness execution #101'. */
  get executionLabel(): string {
    const raw = (this.lastExecution || '').toString().trim();
    if (!raw) return 'n/a';
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

  get hasRewardsTier(): boolean {
    return !!(this.member && this.member.rewards_tier);
  }

  refreshExecutionDetails(){
    this.apiService.getDetails()
    .subscribe({
      next: (data) => {
        this.serviceName = data.service_name
        this.lastExecution = data.last_execution_id
        this.applicationVersion = data.application_version
        this.deploymentType = data.deployment_type
        this.isCanary = data.deployment_type === 'canary'
      },
      error: () => {
        // Keep defaults so the dashboard still renders offline.
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
      next: () => { this.ordersDegraded = false; this.ordersChecked = true; },
      error: () => { this.ordersDegraded = true; this.ordersChecked = true; }
    });
  }

  distribution(){
    this.router.navigateByUrl('/distribution')
  }

  checkValue(){
    console.log(this.ffService.variationFF())
    if (this.ffService.variationFF()=="true"){
      return true;
    }
    return false;
  }

  changeGroup(){
    this.ffService.checkCycle("Beta")
  }

  checkRelase(){
    this.apiService.checkRelease()
    .subscribe((data) => {
      if (data.deployment_type == 'canary'){
       this.isCanary= true;
       this.deploymentType = 'canary';
      }
      else{
        this.isCanary= false;
        this.deploymentType = data.deployment_type || 'normal';
      }
    });
  }

}
