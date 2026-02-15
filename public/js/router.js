// Router Module

class Router {
  static currentPage = null;
  static state = null;
  static elements = null;
  static pages = null;

  static init(stateRef, elementsRef, pagesRef) {
    this.state = stateRef;
    this.elements = elementsRef;
    this.pages = pagesRef;
  }

  static navigate(pageName) {
    // Hide current page
    if (this.currentPage) {
      const currentPageEl = document.getElementById(`${this.currentPage}-page`);
      if (currentPageEl) {
        currentPageEl.classList.add('hidden');
      }
    }

    // Update nav items
    this.elements.navItems.forEach(item => {
      item.classList.remove('active');
      if (item.dataset.page === pageName) {
        item.classList.add('active');
      }
    });

    // Show new page
    const newPageEl = document.getElementById(`${pageName}-page`);
    if (newPageEl) {
      newPageEl.classList.remove('hidden');
      this.currentPage = pageName;

      // Update page title
      const pageTitle = this.elements.pageTitle;
      pageTitle.textContent = pageName.charAt(0).toUpperCase() + pageName.slice(1).replace(/([A-Z])/g, ' $1');

      // Render page content
      const renderFn = this.pages[pageName];
      if (renderFn) {
        renderFn();
      }

      // Close mobile sidebar
      this.elements.sidebar.classList.remove('open');
    }
  }
}

export { Router };
