import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-form-textarea',
  standalone: true,
  templateUrl: './form-textarea.html',
  styleUrl: './form-textarea.css',
})
export class FormTextareaComponent {
  @Input({ required: true }) inputId!: string;
  @Input({ required: true }) label!: string;
  @Input() value = '';
  @Input() required = false;
  @Input() error: string | null = null;
  @Input() maxLength?: number;
  @Input() placeholder = '';
  @Input() rows = 4;
  @Output() valueChange = new EventEmitter<string>();
  @Output() blurred = new EventEmitter<void>();

  handleInput(event: Event): void {
    this.valueChange.emit((event.target as HTMLTextAreaElement).value);
  }
}
