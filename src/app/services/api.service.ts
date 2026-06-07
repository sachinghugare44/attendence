import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  createUser(data: any) {
    return this.http.post(`${this.baseUrl}/user`, data);
  }

  getUsers() {
  return this.http.get(`${this.baseUrl}/user`);
  }

  validateUser(credentials: any) {
    return this.http.post(`${this.baseUrl}/user/login`, credentials); 
  }

  createStudent(data: any) {
    return this.http.post(`${this.baseUrl}/student-details`, data);
  }

  getAllStudents() {
    return this.http.get(`${this.baseUrl}/student-details`);
  }

  createCustomerEnquiry(data: any) {
    return this.http.post(`${this.baseUrl}/customer-enquiry`, data);
  }

  getAllCustomerEnquiries() {
    return this.http.get(`${this.baseUrl}/customer-enquiry`);
  }

  getUserByMobile(mobile: string) {
    return this.http.get(`${this.baseUrl}/user/mobile/${mobile}`);
  }

  getUserAttendanceHistory(mobile: string, year: number, month: number) {
    return this.http.get(`${this.baseUrl}/attendance/history/${mobile}/${year}/${month}`);
  }

  getAdminAccessRecord(mobile: string, year: number, month: number) {
    return this.http.get(`${this.baseUrl}/admin-access/${mobile}/${year}/${month}`);
  }

  createAttendance(data: any) {
    return this.http.post(`${this.baseUrl}/attendance/mark`, data);
  }

  submitLeaveRequest(data: any) {
    return this.http.post(`${this.baseUrl}/admin-access`, data);
  }
}
