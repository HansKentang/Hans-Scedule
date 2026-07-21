import re

with open('login.html', 'r', encoding='utf-8') as f:
    content = f.read()

carousel_js = '''
        // ─── Carousel Auto-Rotate ───
        var track = document.getElementById('carouselTrack');
        var dots = document.querySelectorAll('.auth-carousel-dot');
        var slideCount = 6;
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
        }
'''

# Insert before the closing of initGSI's DOMContentLoaded callback
# Find the closing of the DOMContentLoaded function before the Google Sign-In section
marker = "        // ─── Initialize Google Sign-In ───"
idx = content.find(marker)
if idx == -1:
    print("ERROR: marker not found")
    exit(1)

new_content = content[:idx] + carousel_js + content[idx:]

with open('login.html', 'w', encoding='utf-8') as f:
    f.write(new_content)

print("SUCCESS: Carousel JS added to login.html")
