import { AppTaskComponent } from './task.component';

describe('AppTaskComponent', () => {
  let component: AppTaskComponent;

  beforeEach(() => {
    component = new AppTaskComponent({
      getSectionWiseTask: () => [],
    } as any);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
