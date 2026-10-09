import { initDepartmentPage } from '../components/department/DepartmentPage.js';

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => initDepartmentPage('sports'));
} else {
  initDepartmentPage('sports');
}
