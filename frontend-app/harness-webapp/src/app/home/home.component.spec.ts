import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { HomeComponent } from './home.component';
import { ApiserviceService } from '../_services/apiservice.service';
import { HarnessFfService } from '../harness-ff.service';

function setup(opts: { canary: boolean; ordersFail: boolean }) {
  const api = {
    getDetails: () => of({ service_name: 'workshop', last_execution_id: 'exec-101', application_version: 'build-43',
      deployment_type: opts.canary ? 'canary' : 'normal' }),
    getMember: () => of({ first_name: 'Alex', last_name: 'Member', email: 'alex.member@example.com', rewards_tier: 'Platinum' }),
    getHealth: () => of({ status: 'ok' }),
    getOrders: () => (opts.ordersFail ? throwError(() => ({ status: 500 })) : of({ status: 'ok' })),
    checkRelease: () => of({ deployment_type: opts.canary ? 'canary' : 'normal' }),
  };
  TestBed.configureTestingModule({
    imports: [HomeComponent],
    providers: [
      provideRouter([]),
      { provide: ApiserviceService, useValue: api },
      { provide: HarnessFfService, useValue: { variationFF: () => 'false', checkCycle: () => {} } },
    ],
  });
  const fixture = TestBed.createComponent(HomeComponent);
  fixture.detectChanges();
  return fixture;
}

describe('HomeComponent', () => {
  it('shows a stable, healthy release without the word "normal"', () => {
    const fixture = setup({ canary: false, ordersFail: false });
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.status-strip__label')?.textContent).toContain('STABLE · build-43');
    expect(el.querySelector('.state-chip--ok')?.textContent).toContain('Healthy');
    expect(el.querySelector('.release-badge')).toBeNull();
    expect(el.querySelector('.health')?.textContent).toContain('Healthy');
    expect(el.textContent).toContain('Harness execution #101');
    expect(el.textContent?.toLowerCase()).not.toContain('normal');
  });

  it('shows a consistent rolling-back state when the smoke test fails on canary', () => {
    const fixture = setup({ canary: true, ordersFail: true });
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.smoke-slot--failing')?.textContent).toContain('Smoke test failed');
    expect(el.querySelector('.status-strip__label')?.textContent).toContain('CANARY · build-43');
    expect(el.querySelector('.state-chip--bad')?.textContent).toContain('Rolling back');
    expect(el.querySelector('.health')?.textContent).toContain('Failing · smoke test');
    expect(el.querySelector('.health')?.classList).toContain('health--bad');
    expect(el.querySelector('.new-tag')?.textContent).toContain('New in build-43');
  });
});
