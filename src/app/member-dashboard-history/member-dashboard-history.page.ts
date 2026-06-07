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
  currentMonthIndex = new Date().getMonth() + 1;
  currentUserMobile = localStorage.getItem('mobile') || '';
  selectedMonth = new Date().getMonth() + 1;
  selectedYear = new Date().getFullYear();
  selectedUserMobile = this.currentUserMobile;
  selectedUserName = 'Myself';
  isHistoryLoading = false;
  flippedCardId: string | null = null;
  isEditModalOpen = false;
  isEditSubmitting = false;
  editItem: any = null;
  editStatus = '';
  editRemark = '';
  responseData: any;
  userOptions: Array<{ name: string; mobile: string }> = [];
  attendanceHistory: any[] = [];
  private confettiTimer: number | null = null;
  isConfettiVisible = false;
  usertype:any
  accessRecords: any;
  showfinalbutton=false;
  private readonly statusSummaryBase = [
    { label: 'WEEKOFF', status: 'WO', count: 0 },
    { label: 'D.HOLIDAY', status: 'DH', count: 0 },
    { label: 'LEAVE', status: 'L', count: 0 },
    { label: 'PRESENT', status: 'G', count: 0 },
    { label: 'WFH', status: 'WFH', count: 0 },
    { label: 'OTHERS', status: 'O', count: 0 },
  ];
  statusSummary = [...this.statusSummaryBase];

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
    { label: 'WEEKOFF', value: 'WO', icon: 'bed-outline' },
    { label: 'D.HOLIDAY', value: 'DH', icon: 'calendar-clear-outline' },
    { label: 'WFH', value: 'WFH', icon: 'laptop-outline' },
    { label: 'LEAVE', value: 'L', icon: 'airplane-outline' },
    { label: 'PRESENT', value: 'G', icon: 'checkmark-circle-outline' },
    { label: 'OTHERS', value: 'O', icon: 'ellipsis-horizontal-circle-outline' },
  ];

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private apiService: ApiService,
    private toastController: ToastController  
  ) {}

  ngOnInit() {
    this.getAllApiUSerByMobile();
    this.getAllUsers();
    this.usertype = localStorage.getItem('usertype');
    console.log(this.usertype);
    const mobile = localStorage.getItem('mobile');
    const password = localStorage.getItem('name');

    if (!mobile) {
      this.router.navigate(['/login']);
      return;
    }
    this.getFnalbuttonstatus();
  
  }

  ionViewWillEnter() {
    const routeMonth = Number(this.activatedRoute.snapshot.queryParamMap.get('month'));
    const routeMobile = this.activatedRoute.snapshot.queryParamMap.get('mobile');
    const routeUserName = this.activatedRoute.snapshot.queryParamMap.get('userName');
    console.log('Route month:', routeMonth);
    this.selectedMonth = this.isValidMonth(routeMonth) ? routeMonth : this.selectedMonth;
    if (routeMobile) {
      this.selectedUserMobile = routeMobile;
    }
    if (routeUserName) {
      this.selectedUserName = routeUserName;
    }
    console.log('Selected month after validation:', this.selectedMonth);
    this.getUserAttendanceHistory();
    this.getFnalbuttonstatus();
  }

  get selectedMonthName() {
    return this.monthOptions.find(month => month.value === this.selectedMonth)?.name || '';
  }

  get isFinalSubmitEnabled(): boolean {
  const today = new Date();
  const selectedYear = this.selectedYear;
  const selectedMonthIndex = this.selectedMonth;

  const daysInSelectedMonth = new Date(
    selectedYear,
    selectedMonthIndex,
    0
  ).getDate();

  const markedDays = new Set(
    this.attendanceHistory
      .map(item => {
        const date = new Date(item.date);
        return Number.isNaN(date.getTime()) ? null : date.getDate();
      })
      .filter((day): day is number => day !== null)
  ).size;

  // All days must be marked
  const monthIsComplete = markedDays >= daysInSelectedMonth;

  if (!monthIsComplete) {
    return false;
  }

  // Already submitted => Disable button
  if (this.accessRecords?.finalMonthSubmit === true) {
    return false;
  }

  // Previous month
  if (selectedMonthIndex < today.getMonth() + 1) {
    return true;
  }

  // Future month
  if (selectedMonthIndex > today.getMonth() + 1) {
    return false;
  }

  // Current month: only allow on last day
  return today.getDate() >= daysInSelectedMonth;
}

  onMonthChange(event: any) {
    const month = Number(event?.detail?.value);
    if (!this.isValidMonth(month)) {
      return;
    }

    this.selectedMonth = month;
    this.getUserAttendanceHistory();
    this.getFnalbuttonstatus();
    
  }

  onUserChange(event: any) {
    const mobile = String(event?.detail?.value || '');
    if (!mobile) {
      return;
    }

    this.selectedUserMobile = mobile;
    this.selectedUserName = this.userOptions.find(user => user.mobile === mobile)?.name || 'Selected Member';
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

  getAllUsers() {
    this.apiService.getUsers().subscribe({
      next: (response: any) => {
        const users = response?.data || response || [];
        this.userOptions = (users || [])
          .map((user: any) => ({
            name: user?.name,
            mobile: String(user?.mobile || '')
          }))
          .filter((user: any) => user.name && user.mobile);

        if (!this.selectedUserMobile && this.userOptions.length) {
          this.selectedUserMobile = this.userOptions[0].mobile;
          this.selectedUserName = this.userOptions[0].name;
        } else if (this.selectedUserMobile) {
          this.selectedUserName = this.userOptions.find(user => user.mobile === this.selectedUserMobile)?.name || this.selectedUserName;
        }
      },
      error: error => console.error(error)
    });
  }

  getUserAttendanceHistory() {
    const mobile = this.selectedUserMobile || localStorage.getItem('mobile');
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
      G: 'Present',
      WFH: 'Work From Home',
      L: 'Leave',
      DH: 'D.Holiday',
      WO: 'Weekend',
      O: 'Others'
    };
    return statusMap[status] || status;
  }

  logout() {
    localStorage.clear();
    this.router.navigate(['/login']);
  }

  private buildStatusSummary() {
    this.statusSummary = this.statusSummaryBase.map(item => ({
      ...item,
      count: this.attendanceHistory.filter(history => history.status === item.status).length
    }));
  }

  private isValidMonth(month: number) {
    return Number.isInteger(month) && month >= 1 && month <= 12;
  }

  goBack() {
    if(localStorage.getItem('usertype') === '2'){
      this.router.navigate(['/admin-dashboard']);
    }
    else {
      this.router.navigate(['/member-dashboard']);
    }
  }

  submitFinalMonth() {
    if (!this.isFinalSubmitEnabled) {
      return;
    }
    const paload = {
    userMobile: localStorage.getItem('mobile'),
    year: 2026,
    month: this.selectedMonth,
    finalMonthSubmit: true
}
    this.apiService.submitLeaveRequest(paload).subscribe({
    next: response => {
    this.presentToast('Month submitted successfully!', 'primary');
    console.log('Final month submit response:', response);
  },
  error: error => {
    console.error('Error submitting final month:', error);
    this.presentToast('Failed to submit month. Please try again.', 'danger');
  }
});
    console.log('Final month submit should call backend here');
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
  
  getFnalbuttonstatus(){
      this.apiService.getAdminAccessRecord(this.currentUserMobile, this.selectedYear, this.selectedMonth).subscribe({
      next: (response: any) => {
        this.accessRecords = response?.data;
        this.showfinalbutton  = this.accessRecords.finalMonthSubmit || false;
        console.log('Admin access records:', this.showfinalbutton);
      }
    });
  }

   isMonthAccessible(monthIndex: number): boolean {
    return monthIndex === this.currentMonthIndex;
  }
}
