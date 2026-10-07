import { Component, EventEmitter, Input, Output } from '@angular/core';

export interface FormSelectOption {
  value: string;
  label: string;
}

@Component({
  selector: 'app-form-select',
  standalone: true,
  templateUrl: './form-select.html',
  styleUrl: './form-select.css',
})
export class FormSelectComponent {
  @Input({ required: true }) inputId!: string;
  @Input({ required: true }) label!: string;
  @Input() value = '';
  @Input() options: FormSelectOption[] = [];
  @Input() required = false;
  @Input() error: string | null = null;
  @Output() valueChange = new EventEmitter<string>();
  @Output() blurred = new EventEmitter<void>();

  handleChange(event: Event): void {
    this.valueChange.emit((event.target as HTMLSelectElement).value);
  }
}
