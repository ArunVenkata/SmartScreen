import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SubappComponent } from './subapp.component';

describe('SubappComponent', () => {
  let component: SubappComponent;
  let fixture: ComponentFixture<SubappComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SubappComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SubappComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
