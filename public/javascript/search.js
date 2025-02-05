const searchInput = document.getElementById('searchInput');
const searchResults = document.getElementById('searchResults');
const navLinks = document.querySelectorAll('.nav-link');
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

// Filter and display results
function filterLinks(searchTerm) {
  if (debounceTimer) clearTimeout(debounceTimer);

  debounceTimer = setTimeout(() => {
    const normalizedTerm = searchTerm.toLowerCase().trim();
    
    // Clear results
    searchResults.innerHTML = '';
    
    if (!normalizedTerm) {
      searchResults.classList.add('hidden');
      return;
    }

    const matches = Array.from(navLinks)
      .filter(link => {
        const text = link.textContent.toLowerCase();
        const searchData = link.getAttribute('data-search')?.toLowerCase() || '';
        return text.includes(normalizedTerm) || searchData.includes(normalizedTerm);
      })
      .slice(0, 8); // Limit results

    if (matches.length === 0) {
      const noResults = document.createElement('div');
      noResults.classList.add('p-4', 'text-center', 'text-neutral-500');
      noResults.textContent = 'No results found';
      searchResults.appendChild(noResults);
    } else {
      matches.forEach((link, index) => {
        searchResults.appendChild(createResultLink(link, index === 0));
      });
    }

    searchResults.classList.remove('hidden');
  }, 150);
}


// Event listeners
searchInput.addEventListener('input', (e) => filterLinks(e.target.value));
searchInput.addEventListener('focus', () => filterLinks(searchInput.value));

document.addEventListener('click', (e) => {
  if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
    searchResults.classList.add('hidden');
  }
});

// Keyboard navigation
searchInput.addEventListener('keydown', (e) => {
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
});

