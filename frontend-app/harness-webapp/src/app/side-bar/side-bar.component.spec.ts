import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { SideBarComponent } from './side-bar.component';

describe('SideBarComponent', () => {
  let component: SideBarComponent;
  let fixture: ComponentFixture<SideBarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SideBarComponent],
      providers: [provideRouter([])],
    })
    .compileComponents();

    fixture = TestBed.createComponent(SideBarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('uses a neutral monogram instead of a card-network logo', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('img')).toBeNull();
    expect(el.querySelector('.app-nav__mark')?.textContent).toContain('MD');
    expect(el.textContent).toContain('Workshop demo');
  });
});
