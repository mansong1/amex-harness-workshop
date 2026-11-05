import { Component } from '@angular/core';

import { Router } from '@angular/router';
import { ApiserviceService } from '../_services/apiservice.service';
import { HarnessFfService } from '../harness-ff.service';
import { HarnessOfferComponent } from '../harness-offer/harness-offer.component';
import { CommonModule } from '@angular/common';

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
  healthStatus = 'checking…';

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
      next: () => { this.ordersDegraded = false; },
      error: () => { this.ordersDegraded = true; }
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
