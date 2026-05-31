import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../services/api.service';
import { ToastController } from '@ionic/angular';

@Component({
  selector: 'app-member-dashboard-history',
  templateUrl: './member-dashboard-history.page.html',
  styleUrls: ['./member-dashboard-history.page.scss'],
  standalone: false
})
export class MemberDashboardHistoryPage implements OnInit {
  selectedMonth = new Date().getMonth() + 1;
  selectedYear = new Date().getFullYear();
  isHistoryLoading = false;
  flippedCardId: string | null = null;
  isEditModalOpen = false;
  isEditSubmitting = false;
  editItem: any = null;
  editStatus = '';
  editRemark = '';
  responseData: any;
  attendanceHistory: any[] = [];
  private confettiTimer: number | null = null;
  isConfettiVisible = false;

  statusSummary = [
    { label: 'Present', status: 'P', count: 0 },
    { label: 'WFH', status: 'WFH', count: 0 },
    { label: 'Leave', status: 'L', count: 0 },
    { label: 'Holiday', status: 'H', count: 0 }
  ];

  monthOptions = [
    { value: 1, label: 'Jan', name: 'January' },
    { value: 2, label: 'Feb', name: 'February' },
    { value: 3, label: 'Mar', name: 'March' },
    { value: 4, label: 'Apr', name: 'April' },
    { value: 5, label: 'May', name: 'May' },
    { value: 6, label: 'Jun', name: 'June' },
    { value: 7, label: 'Jul', name: 'July' },
    { value: 8, label: 'Aug', name: 'August' },
    { value: 9, label: 'Sep', name: 'September' },
    { value: 10, label: 'Oct', name: 'October' },
    { value: 11, label: 'Nov', name: 'November' },
    { value: 12, label: 'Dec', name: 'December' }
  ];

  statusOptions = [
    { label: 'Present', value: 'P', icon: 'checkmark-circle-outline' },
    { label: 'Leave', value: 'L', icon: 'calendar-clear-outline' },
    { label: 'WFH', value: 'WFH', icon: 'home-outline' },
    { label: 'Holiday', value: 'H', icon: 'sunny-outline' }
  ];

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private apiService: ApiService,
    private toastController: ToastController  
  ) {}

  ngOnInit() {
    this.getAllApiUSerByMobile();
  }

  ionViewWillEnter() {
    const routeMonth = Number(this.activatedRoute.snapshot.queryParamMap.get('month'));
    console.log('Route month:', routeMonth);
    this.selectedMonth = this.isValidMonth(routeMonth) ? routeMonth : this.selectedMonth;
    console.log('Selected month after validation:', this.selectedMonth);
    this.getUserAttendanceHistory();
  }

  get selectedMonthName() {
    return this.monthOptions.find(month => month.value === this.selectedMonth)?.name || '';
  }

  onMonthChange(event: any) {
    const month = Number(event?.detail?.value);
    if (!this.isValidMonth(month)) {
      return;
    }

    this.selectedMonth = month;
    this.getUserAttendanceHistory();
  }

  getAllApiUSerByMobile() {
    const mobile = localStorage.getItem('mobile');
    if (!mobile) {
      return;
    }

    this.apiService.getUserByMobile(mobile).subscribe({
      next: (response: any) => {
        this.responseData = response.data;
        console.log('User details:', this.responseData);
      },
      error: error => console.error(error)
    });
  }

  getUserAttendanceHistory() {
    const mobile = localStorage.getItem('mobile');
    if (!mobile) {
      return;
    }

    this.isHistoryLoading = true;
    this.apiService.getUserAttendanceHistory(mobile, this.selectedYear, this.selectedMonth).subscribe({
      next: (response: any) => {
        this.attendanceHistory = (response.data || []).map((item: any) => ({
          ...item,
          dayName: this.getDayShortName(item.date),
          displayDate: this.getDisplayDate(item.date),
          statusLabel: this.getStatusLabel(item.status)
        }));
        this.flippedCardId = null;
        this.buildStatusSummary();
        this.isHistoryLoading = false;
        console.log('Attendance history:', this.attendanceHistory);
      },
      error: error => {
        this.attendanceHistory = [];
        this.flippedCardId = null;
        this.buildStatusSummary();
        this.isHistoryLoading = false;
        console.error(error);
      }
    });
  }

  toggleCard(item: any) {
    const cardId = item._id || item.id || item.date;
    this.flippedCardId = this.flippedCardId === cardId ? null : cardId;
  }

  openEditModal(item: any, event?: Event) {
    event?.stopPropagation();
    this.editItem = item;
    this.editStatus = item.status || '';
    this.editRemark = item.note || item.remark || '';
    this.isEditModalOpen = true;
  }

  closeEditModal() {
    this.isEditModalOpen = false;
    this.isEditSubmitting = false;
    this.editItem = null;
    this.editStatus = '';
    this.editRemark = '';
  }

  selectEditStatus(status: string) {
    this.editStatus = status;
  }

  submitEditStatus() {
    if (!this.editItem?.date || !this.editStatus) {
      return;
    }

    const payload = {
      userMobile: localStorage.getItem('mobile'),
      date: this.editItem.date,
      status: this.editStatus,
      note: this.editRemark
    };

    this.isEditSubmitting = true;
    this.apiService.createAttendance(payload).subscribe({
      next: response => {
      this.presentToast('Attendance Updated successfully!', 'primary');
      this.playConfetti();
        this.closeEditModal();
        this.getUserAttendanceHistory();
        

      },
      error: error => {
        this.isEditSubmitting = false;
        console.error(error);
      }
    });
  }

  isCardFlipped(item: any) {
    const cardId = item._id || item.id || item.date;
    return this.flippedCardId === cardId;
  }

  getStatusClass(status: string) {
    return `status-${(status || '').toLowerCase()}`;
  }

  getDayShortName(dateValue: string) {
    return dateValue ? new Date(dateValue).toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase() : '';
  }

  getDisplayDate(dateValue: string) {
    return dateValue ? new Date(dateValue).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }) : '';
  }

  getStatusLabel(status: string) {
    const statusMap: Record<string, string> = {
      P: 'Present',
      WFH: 'Work From Home',
      L: 'Leave',
      H: 'Holiday'
    };
    return statusMap[status] || status;
  }

  logout() {
    localStorage.clear();
    this.router.navigate(['/login']);
  }

  private buildStatusSummary() {
    this.statusSummary = this.statusSummary.map(item => ({
      ...item,
      count: this.attendanceHistory.filter(history => history.status === item.status).length
    }));
  }

  private isValidMonth(month: number) {
    return Number.isInteger(month) && month >= 1 && month <= 12;
  }

  goBack() {
    this.router.navigate(['/member-dashboard']);
  }
  private async presentToast(message: string, color: 'success' | 'danger' | 'primary') {
    const toast = await this.toastController.create({
      message,
      duration: 2200,
      position: 'bottom',
      color,
      cssClass: 'auth-toast',
      buttons: [{ text: 'Close', role: 'cancel' }]
    });

    await toast.present();
  }

   private playConfetti() {
    if (this.confettiTimer) {
      window.clearTimeout(this.confettiTimer);
    }

    this.isConfettiVisible = true;
    this.confettiTimer = window.setTimeout(() => {
      this.isConfettiVisible = false;
      this.confettiTimer = null;
    }, 3400);
  }
}
