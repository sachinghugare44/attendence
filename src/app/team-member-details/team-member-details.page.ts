import { Component, OnInit } from '@angular/core';
import { ApiService } from '../services/api.service';
import { Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

interface MonthAttendanceStatus {
  label: string;
  month: number;
  year: number;
  submitted: boolean;
  loading?: boolean;
}

interface TeamMember {
  name?: string;
  mobile?: string;
  email?: string;
  role?: string;
  photo?: string;
  status?: string;
  attendanceStatus?: {
    current: MonthAttendanceStatus;
    previous: MonthAttendanceStatus;
  };
  usertype?: number;
}

@Component({
  selector: 'app-team-member-details',
  templateUrl: './team-member-details.page.html',
  styleUrls: ['./team-member-details.page.scss'],
  standalone: false
})
export class TeamMemberDetailsPage implements OnInit {
  responseData: any;
  members: TeamMember[] = [];
  isLoadingMembers = false;

  constructor(private apiService:ApiService,
              private router: Router
  ) { }
  ngOnInit(): void {
    const mobile = localStorage.getItem('mobile');
    const password = localStorage.getItem('name');
    const usertype = localStorage.getItem('usertype');

      if (usertype === '2' && mobile != undefined && password != undefined) {
      } 
      else {
        alert('Unauthorized access. Please log in as admin.');
        this.logout();
      // this.router.navigate(['/login']);
      return;
    }
    this.getAllUSerdetails();
    this.getAllApiUSerByMobile();
  }

  getAllUSerdetails(){
    this.isLoadingMembers = true;
    this.apiService.getUsers().subscribe((data:any) => {
      this.members = (data.data || []).map((member: TeamMember) => ({
        ...member,
        attendanceStatus: this.createDefaultAttendanceStatus()
      }));
      this.loadMonthlyStatuses();
      this.isLoadingMembers = false;
      console.log(this.members);
    }, (error) => {
      console.error(error);
      this.isLoadingMembers = false;
    });
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
      error: (error) => {
        console.error(error);
      }
    });
  }

   logout() {
    localStorage.clear();
    this.router.navigate(['/login']);
  }

  getStatusClass(status?: MonthAttendanceStatus) {
    return status?.submitted ? 'submitted' : 'pending';
  }

  private loadMonthlyStatuses() {
    const months = this.getCurrentAndPreviousMonth();

    this.members.forEach((member) => {
      if (!member.mobile) {
        member.attendanceStatus = this.createDefaultAttendanceStatus();
        return;
      }

      forkJoin({
        current: this.getAdminAccessStatus(member.mobile, months.current.year, months.current.month, 'Current Month'),
        previous: this.getAdminAccessStatus(member.mobile, months.previous.year, months.previous.month, 'Last Month')
      }).subscribe({
        next: (attendanceStatus) => {
          member.attendanceStatus = attendanceStatus;
        },
        error: (error) => {
          console.error('Attendance status load failed:', error);
          member.attendanceStatus = this.createDefaultAttendanceStatus();
        }
      });
    });
  }

  private getAdminAccessStatus(mobile: string, year: number, month: number, label: string) {
    return this.apiService.getAdminAccessRecord(mobile, year, month).pipe(
      map((response: any) => ({
        label,
        month,
        year,
        submitted: response?.data?.finalMonthSubmit === true
      })),
      catchError(() => of({
        label,
        month,
        year,
        submitted: false
      }))
    );
  }

  private createDefaultAttendanceStatus() {
    const months = this.getCurrentAndPreviousMonth();

    return {
      current: {
        label: 'Current Month',
        month: months.current.month,
        year: months.current.year,
        submitted: false,
        loading: true
      },
      previous: {
        label: 'Last Month',
        month: months.previous.month,
        year: months.previous.year,
        submitted: false,
        loading: true
      }
    };
  }

  private getCurrentAndPreviousMonth() {
    const today = new Date();
    const current = {
      month: today.getMonth() + 1,
      year: today.getFullYear()
    };
    const previousDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);

    return {
      current,
      previous: {
        month: previousDate.getMonth() + 1,
        year: previousDate.getFullYear()
      }
    };
  }
}
