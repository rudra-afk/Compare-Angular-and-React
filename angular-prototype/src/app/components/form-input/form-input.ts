import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-form-input',
  standalone: true,
  templateUrl: './form-input.html',
  styleUrl: './form-input.css',
})
export class FormInputComponent {
  @Input({ required: true }) inputId!: string;
  @Input({ required: true }) label!: string;
  @Input() value = '';
  @Input() type: 'text' | 'date' = 'text';
  @Input() required = false;
  @Input() error: string | null = null;
  @Input() placeholder = '';
  @Output() valueChange = new EventEmitter<string>();
  @Output() blurred = new EventEmitter<void>();

  handleInput(event: Event): void {
    this.valueChange.emit((event.target as HTMLInputElement).value);
  }
}
