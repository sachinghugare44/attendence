import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';

import { MemberDashboardPage } from './member-dashboard.page';
import { ApiService } from '../services/api.service';
import { ToastController } from '@ionic/angular';
import { Geolocation } from '@capacitor/geolocation';

class MockApiService {}
class MockToastController {
  create() {
    return Promise.resolve({ present: () => Promise.resolve() });
  }
}
class MockGeolocation {
  static getCurrentPosition() {
    return Promise.resolve({ coords: { latitude: 0, longitude: 0, accuracy: 0 } });
  }
}

describe('MemberDashboardPage', () => {
  let component: MemberDashboardPage;
  let fixture: ComponentFixture<MemberDashboardPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MemberDashboardPage],
      imports: [FormsModule, RouterTestingModule],
      providers: [
        { provide: ApiService, useClass: MockApiService },
        { provide: ToastController, useClass: MockToastController },
        { provide: Geolocation, useClass: MockGeolocation }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(MemberDashboardPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('adds each selected date to the list immediately in multiple selection mode', () => {
    component.selectionMode = 'multiple';
    component.selectedDates = [];
    component.selectedCalendarDate = null;

    component.onDateChange({ detail: { value: '2026-07-10T00:00:00.000Z' } });
    component.onDateChange({ detail: { value: '2026-07-11T00:00:00.000Z' } });

    expect(component.selectedDates).toEqual(['2026-07-10', '2026-07-11']);
    expect(component.modalStep).toBe('calendar');
  });

  it('detects when week-off entries already exist for the current month', () => {
    component.attendanceHistoryForMonth = [{ status: 'WO', date: '2026-07-04' }];

    expect((component as any).hasExistingWeekOffSelectionForCurrentMonth()).toBeTrue();
  });
});
