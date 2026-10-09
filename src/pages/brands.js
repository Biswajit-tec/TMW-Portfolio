import { initDepartmentPage } from '../components/department/DepartmentPage.js';

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => initDepartmentPage('brands'));
} else {
  initDepartmentPage('brands');
}
