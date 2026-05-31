import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-explore-container',
  templateUrl: './explore-container.component.html',
  styleUrls: ['./explore-container.component.scss'],
  standalone: false,
})
export class ExploreContainerComponent implements OnInit {

  @Input() name?: string;

constructor(){
  console.log(this.name)
}
ngOnInit(): void {
  console.log(this.name)
}
}
