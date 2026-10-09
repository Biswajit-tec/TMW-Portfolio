import { initDepartmentPage } from '../components/department/DepartmentPage.js';

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => initDepartmentPage('films'));
} else {
  initDepartmentPage('films');
}
