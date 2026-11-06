import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { HomeComponent } from './home.component';
import { ApiserviceService } from '../_services/apiservice.service';
import { HarnessFfService } from '../harness-ff.service';

function setup(opts: { canary: boolean; ordersFail: boolean; details?: any }) {
  const details = opts.details ?? {
    service_name: 'backend', last_execution_id: '101', application_version: 'cut1hws274-43',
    execution_url: 'https://app.harness.io/ng/executions/abc', deployment_type: opts.canary ? 'canary' : 'normal',
  };
  const api = {
    getDetails: () => of(details),
    getMember: () => of({ first_name: 'Alex', last_name: 'Member', email: 'alex.member@example.com', rewards_tier: 'Platinum' }),
    getHealth: () => of({ status: 'ok' }),
    getOrders: () => (opts.ordersFail ? throwError(() => ({ status: 500 }))
      : of({ status: 'ok', orders: [{ id: 'ORD-1', item: 'Trail running shoes', merchant: 'Northwind', status: 'Shipped', amount: 129 }] })),
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
  return fixture.nativeElement as HTMLElement;
}

describe('HomeComponent', () => {
  it('shows a stable, healthy release with the real build and execution link', () => {
    const el = setup({ canary: false, ordersFail: false });
    expect(el.querySelector('.release-bar__label')?.textContent).toContain('STABLE · cut1hws274-43');
    expect(el.querySelector('.state-chip--ok')?.textContent).toContain('Healthy');
    const link = el.querySelector('a.release-bar__exec') as HTMLAnchorElement;
    expect(link.textContent).toContain('Harness execution #101');
    expect(link.href).toContain('app.harness.io');
    expect(el.textContent?.toLowerCase()).not.toContain('normal');
  });

  it('shows card-member content: balance, transactions, rewards, orders and Pay', () => {
    const el = setup({ canary: false, ordersFail: false });
    expect(el.textContent).toContain('Current balance');
    expect(el.textContent).toContain('Recent transactions');
    expect(el.querySelector('.tier-chip')?.textContent).toContain('Platinum');
    // The tag credits the DB3 schema change, not the build, so stable shows it too.
    expect(el.querySelector('.new-tag')?.textContent).toContain('New with DB update');
    expect(el.querySelector('.new-tag')?.textContent).not.toContain('cut1hws274');
    expect(el.textContent).toContain('Trail running shoes');
    expect(Array.from(el.querySelectorAll('button')).map((b) => b.textContent?.trim()))
      .toEqual(jasmine.arrayContaining(['Pay', 'Check Release', 'Start Distribution Test']));
  });

  it('shows a consistent rolling-back state and a broken orders panel when the smoke test fails', () => {
    const el = setup({ canary: true, ordersFail: true });
    expect(el.querySelector('.smoke-slot--failing')?.textContent).toContain('Smoke test failed');
    expect(el.querySelector('.release-bar__label')?.textContent).toContain('CANARY · cut1hws274-43');
    expect(el.querySelector('.state-chip--bad')?.textContent).toContain('Rolling back');
    expect(el.querySelector('.orders-error')?.textContent).toContain('HTTP 500');
    expect(el.querySelector('.new-tag')?.textContent).toContain('New with DB update');
  });

  it('says unknown instead of inventing a build or execution', () => {
    const el = setup({ canary: false, ordersFail: false, details: { deployment_type: 'normal' } });
    expect(el.querySelector('.release-bar__label')?.textContent).toContain('build unknown');
    expect(el.querySelector('.release-bar__exec')?.textContent).toContain('Harness execution unknown');
    expect(el.querySelector('a.release-bar__exec')).toBeNull();
  });
});
