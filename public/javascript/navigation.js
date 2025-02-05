document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const sidebar = document.getElementById('pc-sidebar');
  const sidebarContent = document.getElementById('pc-sidebar2');
  const sidebarToggle = document.getElementById('sidebar-toggle');
  const searchInput = document.getElementById('searchInput');
  const searchResults = document.getElementById('searchResults');
  const navLinks = document.querySelectorAll('.nav-link');
  const activeBackground = document.getElementById('active-background');
  let debounceTimer;

  // Create result link
  function createResultLink(link, isFirst) {
    const resultLink = document.createElement('a');
    resultLink.href = link.href;
    resultLink.classList.add(
      'flex', 'items-center', 'px-4', 'py-2', 'mt-2',
      'text-sm', 'rounded-xl', 'transition-colors',
      'text-neutral-700', 'dark:text-neutral-300',
      'hover:bg-neutral-100', 'dark:hover:bg-neutral-800'
    );

    if (isFirst) {
      resultLink.classList.add('bg-neutral-50', 'dark:bg-neutral-800/50');
    }

    // Clone icon if exists
    const originalIcon = link.querySelector('svg');
    if (originalIcon) {
      const icon = originalIcon.cloneNode(true);
      icon.classList.add('w-5', 'h-5', 'mr-3', 'flex-shrink-0');
      resultLink.appendChild(icon);
    }

    // Add text
    const text = document.createElement('span');
    text.textContent = link.textContent.trim();
    text.classList.add('flex-grow');
    resultLink.appendChild(text);

    // Add path badge
    const path = link.getAttribute('data-path');
    if (path) {
      const badge = document.createElement('span');
      badge.textContent = path;
      badge.classList.add(
        'ml-2', 'px-2', 'py-1', 'text-xs', 'rounded-md',
        'bg-neutral-100', 'dark:bg-neutral-800',
        'text-neutral-500', 'dark:text-neutral-400'
      );
      resultLink.appendChild(badge);
    }

    return resultLink;
  }

  // Sidebar Toggle
  sidebarToggle?.addEventListener('click', () => {
    const isCollapsed = sidebar.classList.contains('sidebar-collapsed');
    sidebar.classList.toggle('sidebar-collapsed', !isCollapsed);
    sidebar.classList.toggle('sidebar-expanded', isCollapsed);
    sidebarContent.classList.toggle('items-center', !isCollapsed);
  });

  // Search Functionality
  function handleSearch(event) {
    const searchTerm = event.target.value.toLowerCase().trim();
		
    if (debounceTimer) clearTimeout(debounceTimer);

    debounceTimer = setTimeout(() => {
      searchResults.innerHTML = '';
			
      if (!searchTerm) {
        searchResults.classList.add('hidden');
        return;
      }

      const matches = Array.from(navLinks)
        .filter(link => {
          const text = link.textContent.toLowerCase();
          const searchData = link.getAttribute('data-search')?.toLowerCase() || '';
          return text.includes(searchTerm) || searchData.includes(searchTerm);
        })
        .slice(0, 8);

      if (matches.length === 0) {
        const noResults = document.createElement('div');
        noResults.classList.add('p-4', 'text-center', 'text-neutral-500');
        searchResults.appendChild(noResults);
      } else {
        matches.forEach((link, index) => {
          searchResults.appendChild(createResultLink(link, index === 0));
        });
      }
			
      searchResults.classList.remove('hidden');
    }, 150);
  }

  // Event Listeners
  searchInput?.addEventListener('input', handleSearch);
  searchInput?.addEventListener('focus', () => {
    if (searchInput.value) handleSearch({ target: searchInput });
  });

  // Keyboard Navigation
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      searchInput?.focus();
    }

    if (!searchResults.classList.contains('hidden')) {
      const results = searchResults.querySelectorAll('a');
      const current = searchResults.querySelector('.bg-neutral-50, .dark\\:bg-neutral-800\\/50');
      let index = Array.from(results).indexOf(current);

      switch (e.key) {
      case 'ArrowDown':
      case 'ArrowUp':
        e.preventDefault();
        results[index]?.classList.remove('bg-neutral-50', 'dark:bg-neutral-800/50');
					
        if (e.key === 'ArrowDown') {
          index = index < results.length - 1 ? index + 1 : 0;
        } else {
          index = index > 0 ? index - 1 : results.length - 1;
        }
					
        results[index]?.classList.add('bg-neutral-50', 'dark:bg-neutral-800/50');
        results[index]?.scrollIntoView({ block: 'nearest' });
        break;

      case 'Enter':
        e.preventDefault();
        if (current) window.location.href = current.href;
        break;

      case 'Escape':
        e.preventDefault();
        searchResults.classList.add('hidden');
        searchInput.blur();
        break;
      }
    }
  });

  // Click Outside Handler
  document.addEventListener('click', (e) => {
    if (!searchInput?.contains(e.target) && !searchResults?.contains(e.target)) {
      searchResults?.classList.add('hidden');
    }
  });

  // Active Link Handler
  const updateActiveLink = () => {
    const currentPath = window.location.pathname;
    navLinks.forEach(link => {
      const href = link.getAttribute('href');
      if (href === currentPath) {
        link.classList.add('active');
        const rect = link.getBoundingClientRect();
        const container = link.closest('ul');
        if (container && activeBackground) {
          const containerRect = container.getBoundingClientRect();
          activeBackground.style.transform = `translateY(${rect.top - containerRect.top}px)`;
        }
      }
    });
  };

  // Initialize
  updateActiveLink();
  window.addEventListener('popstate', updateActiveLink);
});