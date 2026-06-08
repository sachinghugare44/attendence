import { Component, OnInit } from '@angular/core';
import { Geolocation } from '@capacitor/geolocation';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent implements OnInit {
  constructor() {

  }
  async ngOnInit(): Promise<void> {
  const position = await Geolocation.getCurrentPosition();
  console.log('Current position:', position);
  }
}
