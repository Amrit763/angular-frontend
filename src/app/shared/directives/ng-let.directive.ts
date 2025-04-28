// src/app/shared/directives/ng-let.directive.ts
import { Directive, Input, TemplateRef, ViewContainerRef } from '@angular/core';

interface NgLetContext<T> {
  ngLet: T;
}

@Directive({
  selector: '[ngLet]',
  standalone: true
})
export class NgLetDirective<T> {
  private context: NgLetContext<T> = { ngLet: null as any };
  private hasView = false;

  constructor(
    private viewContainer: ViewContainerRef,
    private templateRef: TemplateRef<NgLetContext<T>>
  ) {}

  @Input()
  set ngLet(value: T) {
    this.context.ngLet = value;
    if (!this.hasView) {
      this.viewContainer.createEmbeddedView(this.templateRef, this.context);
      this.hasView = true;
    }
  }
}