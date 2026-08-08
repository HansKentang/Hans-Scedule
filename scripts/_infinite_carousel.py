import sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

old_js = """        var slideCount = 6;
        var currentSlide = 0;
        var autoInterval = null;
        var CAROUSEL_INTERVAL = 4000;

        function goToSlide(index) {
          if (index < 0) index = slideCount - 1;
          if (index >= slideCount) index = 0;
          currentSlide = index;
          track.style.transform = 'translateX(-' + (index * 100) + '%)';
          dots.forEach(function(d, i) {
            d.classList.toggle('active', i === index);
          });
          // Update label
          var label = document.getElementById('carouselLabel');
          var idxEl = document.getElementById('carouselIndex');
          var names = ['Schedule', 'Hub', 'Finance', 'Analytics', 'Goals', 'Activities'];
          if (label) label.textContent = names[index];
          if (idxEl) idxEl.textContent = (index + 1) + ' / ' + slideCount;
          // 3D effect - scale active slide, shrink inactive
          var allSlides = document.querySelectorAll('.auth-carousel-slide');
          allSlides.forEach(function(s, i) {
            s.classList.toggle('active-slide', i === index);
            s.classList.toggle('inactive-slide', i !== index);
          });
        }

        function nextSlide() { goToSlide(currentSlide + 1); }

        function startAutoRotate() {
          if (autoInterval) clearInterval(autoInterval);
          autoInterval = setInterval(nextSlide, CAROUSEL_INTERVAL);
        }

        // Init
        if (track) {
          goToSlide(0);
          startAutoRotate();

          // Dot clicks
          dots.forEach(function(dot) {
            dot.addEventListener('click', function() {
              var idx = parseInt(this.getAttribute('data-index'));
              goToSlide(idx);
              startAutoRotate(); // reset timer
            });
          });

          // Pause on hover
          var carousel = document.querySelector('.auth-carousel');
          if (carousel) {
            carousel.addEventListener('mouseenter', function() {
              if (autoInterval) clearInterval(autoInterval);
              autoInterval = null;
            });
            carousel.addEventListener('mouseleave', function() {
              startAutoRotate();
            });
          }
        }"""

new_js = """        var currentSlide = 0;
        var autoInterval = null;
        var CAROUSEL_INTERVAL = 4000;
        var REAL_SLIDE_COUNT = 6;

        function goToSlide(index, instant) {
          if (index < 0) index = 0;
          if (index >= slideCount) index = 0;

          currentSlide = index;

          if (instant) {
            track.style.transition = 'none';
            track.style.transform = 'translateX(-' + (index * 100) + '%)';
            track.offsetHeight;
            track.style.transition = '';
          } else {
            track.style.transform = 'translateX(-' + (index * 100) + '%)';
          }

          // Dots: use modulo for the clone
          var dotIndex = index >= REAL_SLIDE_COUNT ? 0 : index;
          dots.forEach(function(d, i) {
            d.classList.toggle('active', i === dotIndex);
          });

          // Update label
          var label = document.getElementById('carouselLabel');
          var idxEl = document.getElementById('carouselIndex');
          var names = ['Schedule', 'Hub', 'Finance', 'Analytics', 'Goals', 'Activities'];
          if (label) label.textContent = names[dotIndex];
          if (idxEl) idxEl.textContent = (dotIndex + 1) + ' / ' + REAL_SLIDE_COUNT;

          // 3D effect
          var allSlides = document.querySelectorAll('.auth-carousel-slide');
          allSlides.forEach(function(s, i) {
            s.classList.toggle('active-slide', i === index);
            s.classList.toggle('inactive-slide', i !== index);
          });

          // If on the clone (last slide), after transition silently jump to real first
          if (index === slideCount - 1) {
            setTimeout(function() {
              goToSlide(0, true);
            }, 800);
          }
        }

        function nextSlide() { goToSlide(currentSlide + 1); }

        function startAutoRotate() {
          if (autoInterval) clearInterval(autoInterval);
          autoInterval = setInterval(nextSlide, CAROUSEL_INTERVAL);
        }

        // Init
        if (track) {
          // Clone first slide for seamless infinite loop
          var firstSlide = track.querySelector('.auth-carousel-slide');
          var clone = firstSlide.cloneNode(true);
          track.appendChild(clone);
          slideCount = REAL_SLIDE_COUNT + 1;

          goToSlide(0);
          startAutoRotate();

          // Dot clicks
          dots.forEach(function(dot) {
            dot.addEventListener('click', function() {
              var idx = parseInt(this.getAttribute('data-index'));
              goToSlide(idx);
              startAutoRotate();
            });
          });

          // Pause on hover
          var carousel = document.querySelector('.auth-carousel');
          if (carousel) {
            carousel.addEventListener('mouseenter', function() {
              if (autoInterval) clearInterval(autoInterval);
              autoInterval = null;
            });
            carousel.addEventListener('mouseleave', function() {
              startAutoRotate();
            });
          }
        }"""

def apply(path):
    with open(path, 'r', encoding='utf-8') as f:
        html = f.read()
    if old_js in html:
        html = html.replace(old_js, new_js)
        with open(path, 'w', encoding='utf-8') as f:
            f.write(html)
        print(f'SUCCESS: Infinite carousel JS applied to {path}')
    else:
        print(f'ERROR: Could not find old JS block in {path}')
        # Try to find approximate location
        idx = html.find('slideCount = 6')
        if idx >= 0:
            print(f'  Found "slideCount = 6" at position {idx}')

apply('login.html')
apply('haven-desktop/login.html')
