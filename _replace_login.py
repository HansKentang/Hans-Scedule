import re

with open('login.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Find the SVG section markers
start_marker = '          <!-- SVG Dashboard -->\n      <div class="auth-right-svg">'
end_marker = '      <!-- Gradient Overlay + Quote -->'

# Find start index
start_idx = content.find(start_marker)
if start_idx == -1:
    print("ERROR: Start marker not found")
    exit(1)

# Find end index - search after start for the overlay marker
end_idx = content.find(end_marker, start_idx)
if end_idx == -1:
    print("ERROR: End marker not found")
    exit(1)

carousel_html = '''          <!-- Carousel Preview -->
      <div class="auth-carousel">
        <div class="auth-carousel-track" id="carouselTrack">

          <!-- Slide 1: Schedule -->
          <div class="auth-carousel-slide">
            <svg viewBox="0 0 480 340" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="480" height="340" rx="14" fill="#0a0a0a"/>
              <rect x="0.5" y="0.5" width="479" height="339" rx="13.5" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>
              <rect x="0" y="0" width="480" height="38" rx="14" fill="rgba(255,255,255,0.03)"/>
              <circle cx="18" cy="15" r="3" fill="rgba(255,255,255,0.12)"/><circle cx="30" cy="15" r="3" fill="rgba(255,255,255,0.08)"/><circle cx="42" cy="15" r="3" fill="rgba(255,255,255,0.06)"/>
              <text x="240" y="19" text-anchor="middle" font-family="'Hanken Grotesk',sans-serif" font-size="8" font-weight="600" fill="rgba(255,255,255,0.2)" letter-spacing="0.08em">SCHEDULE</text>
              <text x="24" y="66" font-family="'Hanken Grotesk',sans-serif" font-size="10" font-weight="600" fill="rgba(255,255,255,0.4)">This Week</text>
              <text x="60" y="90" font-family="'Space Grotesk',monospace" font-size="6" font-weight="600" fill="rgba(255,255,255,0.15)" text-anchor="middle" letter-spacing="0.06em">MON</text>
              <text x="148" y="90" font-family="'Space Grotesk',monospace" font-size="6" font-weight="600" fill="rgba(255,255,255,0.15)" text-anchor="middle" letter-spacing="0.06em">TUE</text>
              <text x="236" y="90" font-family="'Space Grotesk',monospace" font-size="6" font-weight="600" fill="rgba(255,255,255,0.15)" text-anchor="middle" letter-spacing="0.06em">WED</text>
              <text x="324" y="90" font-family="'Space Grotesk',monospace" font-size="6" font-weight="600" fill="rgba(255,255,255,0.15)" text-anchor="middle" letter-spacing="0.06em">THU</text>
              <text x="412" y="90" font-family="'Space Grotesk',monospace" font-size="6" font-weight="600" fill="rgba(255,255,255,0.15)" text-anchor="middle" letter-spacing="0.06em">FRI</text>
              <line x1="48" y1="96" x2="460" y2="96" stroke="rgba(255,255,255,0.03)" stroke-width="0.5"/>
              <text x="46" y="118" font-family="'Space Grotesk',monospace" font-size="5" fill="rgba(255,255,255,0.06)">8a</text>
              <text x="46" y="148" font-family="'Space Grotesk',monospace" font-size="5" fill="rgba(255,255,255,0.06)">9a</text>
              <text x="44" y="178" font-family="'Space Grotesk',monospace" font-size="5" fill="rgba(255,255,255,0.06)">10a</text>
              <rect x="62" y="106" width="74" height="16" rx="3" fill="rgba(255,255,255,0.12)"/><rect x="62" y="106" width="3" height="16" rx="1.5" fill="rgba(255,255,255,0.3)"/><text x="70" y="117" font-family="'Hanken Grotesk',sans-serif" font-size="6" fill="rgba(255,255,255,0.4)">Design</text>
              <rect x="62" y="162" width="74" height="14" rx="3" fill="rgba(255,255,255,0.08)"/><rect x="62" y="162" width="3" height="14" rx="1.5" fill="rgba(255,255,255,0.2)"/><text x="70" y="172" font-family="'Hanken Grotesk',sans-serif" font-size="6" fill="rgba(255,255,255,0.35)">Sync</text>
              <rect x="150" y="96" width="74" height="18" rx="3" fill="rgba(255,255,255,0.08)"/><rect x="150" y="96" width="3" height="18" rx="1.5" fill="rgba(255,255,255,0.2)"/><text x="158" y="109" font-family="'Hanken Grotesk',sans-serif" font-size="6" fill="rgba(255,255,255,0.35)">Standup</text>
              <rect x="150" y="136" width="74" height="30" rx="3" fill="rgba(255,255,255,0.12)"/><rect x="150" y="136" width="3" height="30" rx="1.5" fill="rgba(255,255,255,0.3)"/><text x="158" y="155" font-family="'Hanken Grotesk',sans-serif" font-size="6" fill="rgba(255,255,255,0.4)">Deep Work</text>
              <rect x="238" y="92" width="74" height="20" rx="3" fill="rgba(255,255,255,0.12)"/><rect x="238" y="92" width="3" height="20" rx="1.5" fill="rgba(255,255,255,0.3)"/><text x="246" y="106" font-family="'Hanken Grotesk',sans-serif" font-size="6" fill="rgba(255,255,255,0.4)">Research</text>
              <rect x="238" y="148" width="74" height="14" rx="3" fill="rgba(255,255,255,0.06)"/><rect x="238" y="148" width="3" height="14" rx="1.5" fill="rgba(255,255,255,0.15)"/><text x="246" y="158" font-family="'Hanken Grotesk',sans-serif" font-size="6" fill="rgba(255,255,255,0.3)">Gym</text>
              <rect x="326" y="122" width="74" height="14" rx="3" fill="rgba(255,255,255,0.08)"/><rect x="326" y="122" width="3" height="14" rx="1.5" fill="rgba(255,255,255,0.2)"/><text x="334" y="132" font-family="'Hanken Grotesk',sans-serif" font-size="6" fill="rgba(255,255,255,0.35)">1:1</text>
              <rect x="326" y="182" width="74" height="16" rx="3" fill="rgba(255,255,255,0.12)"/><rect x="326" y="182" width="3" height="16" rx="1.5" fill="rgba(255,255,255,0.3)"/><text x="334" y="193" font-family="'Hanken Grotesk',sans-serif" font-size="6" fill="rgba(255,255,255,0.4)">Code</text>
              <rect x="414" y="100" width="74" height="18" rx="3" fill="rgba(255,255,255,0.06)"/><rect x="414" y="100" width="3" height="18" rx="1.5" fill="rgba(255,255,255,0.15)"/><text x="422" y="113" font-family="'Hanken Grotesk',sans-serif" font-size="6" fill="rgba(255,255,255,0.3)">Run</text>
              <rect x="414" y="160" width="74" height="22" rx="3" fill="rgba(255,255,255,0.10)"/><rect x="414" y="160" width="3" height="22" rx="1.5" fill="rgba(255,255,255,0.25)"/><text x="422" y="175" font-family="'Hanken Grotesk',sans-serif" font-size="6" fill="rgba(255,255,255,0.35)">Read</text>
              <!-- Bottom bar -->
              <rect x="24" y="220" width="432" height="1" fill="rgba(255,255,255,0.04)"/>
              <rect x="24" y="230" width="432" height="26" rx="5" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.04)" stroke-width="0.5"/>
              <circle cx="40" cy="243" r="3" fill="rgba(255,255,255,0.3)"/>
              <text x="48" y="246" font-family="'Hanken Grotesk',sans-serif" font-size="7" font-weight="600" fill="rgba(255,255,255,0.5)">8 tasks today</text>
              <text x="168" y="246" font-family="'Hanken Grotesk',sans-serif" font-size="6" fill="rgba(255,255,255,0.25)">3 deep work</text>
              <text x="262" y="246" font-family="'Hanken Grotesk',sans-serif" font-size="6" fill="rgba(255,255,255,0.25)">2 meetings</text>
              <!-- Tag chips -->
              <rect x="24" y="270" width="70" height="16" rx="8" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.05)" stroke-width="0.5"/><text x="32" y="281" font-family="'Hanken Grotesk',sans-serif" font-size="5.5" fill="rgba(255,255,255,0.25)">Deep Work</text>
              <rect x="100" y="270" width="60" height="16" rx="8" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.05)" stroke-width="0.5"/><text x="108" y="281" font-family="'Hanken Grotesk',sans-serif" font-size="5.5" fill="rgba(255,255,255,0.25)">Meeting</text>
              <rect x="166" y="270" width="58" height="16" rx="8" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.05)" stroke-width="0.5"/><text x="174" y="281" font-family="'Hanken Grotesk',sans-serif" font-size="5.5" fill="rgba(255,255,255,0.25)">Study</text>
              <rect x="230" y="270" width="56" height="16" rx="8" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.05)" stroke-width="0.5"/><text x="238" y="281" font-family="'Hanken Grotesk',sans-serif" font-size="5.5" fill="rgba(255,255,255,0.25)">Hobby</text>
            </svg>
          </div>

          <!-- Slide 2: Hub -->
          <div class="auth-carousel-slide">
            <svg viewBox="0 0 480 340" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="480" height="340" rx="14" fill="#0a0a0a"/>
              <rect x="0.5" y="0.5" width="479" height="339" rx="13.5" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>
              <rect x="0" y="0" width="480" height="38" rx="14" fill="rgba(255,255,255,0.03)"/>
              <circle cx="18" cy="15" r="3" fill="rgba(255,255,255,0.12)"/><circle cx="30" cy="15" r="3" fill="rgba(255,255,255,0.08)"/><circle cx="42" cy="15" r="3" fill="rgba(255,255,255,0.06)"/>
              <text x="240" y="19" text-anchor="middle" font-family="'Hanken Grotesk',sans-serif" font-size="8" font-weight="600" fill="rgba(255,255,255,0.2)" letter-spacing="0.08em">HUB</text>
              <!-- Sidebar block -->
              <rect x="12" y="52" width="36" height="276" rx="5" fill="rgba(255,255,255,0.02)"/>
              <rect x="18" y="64" width="24" height="24" rx="4" fill="rgba(255,255,255,0.06)"/>
              <rect x="18" y="96" width="24" height="24" rx="4" fill="rgba(255,255,255,0.04)"/>
              <rect x="18" y="128" width="24" height="24" rx="4" fill="rgba(255,255,255,0.10)"/>
              <rect x="18" y="160" width="24" height="24" rx="4" fill="rgba(255,255,255,0.04)"/>
              <!-- Bento grid widgets -->
              <rect x="60" y="52" width="194" height="86" rx="6" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.04)" stroke-width="0.5"/>
              <text x="76" y="76" font-family="'Hanken Grotesk',sans-serif" font-size="6" font-weight="600" fill="rgba(255,255,255,0.2)" letter-spacing="0.06em">CLOCK</text>
              <text x="76" y="102" font-family="'Hanken Grotesk',sans-serif" font-size="14" font-weight="300" fill="rgba(255,255,255,0.5)">9:41</text>
              <circle cx="220" cy="90" r="16" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.06)" stroke-width="0.5"/>
              <text x="220" y="88" text-anchor="middle" font-family="'Hanken Grotesk',sans-serif" font-size="5" fill="rgba(255,255,255,0.3)">TASKS</text>
              <text x="220" y="98" text-anchor="middle" font-family="'Hanken Grotesk',sans-serif" font-size="6" fill="rgba(255,255,255,0.4)">12</text>
              <rect x="60" y="146" width="128" height="82" rx="6" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.04)" stroke-width="0.5"/>
              <text x="76" y="168" font-family="'Hanken Grotesk',sans-serif" font-size="6" font-weight="600" fill="rgba(255,255,255,0.2)" letter-spacing="0.06em">WIDGET</text>
              <rect x="76" y="178" width="96" height="3" rx="1.5" fill="rgba(255,255,255,0.06)"/><rect x="76" y="178" width="60" height="3" rx="1.5" fill="rgba(255,255,255,0.15)"/>
              <rect x="76" y="188" width="96" height="3" rx="1.5" fill="rgba(255,255,255,0.06)"/><rect x="76" y="188" width="80" height="3" rx="1.5" fill="rgba(255,255,255,0.12)"/>
              <rect x="76" y="198" width="96" height="3" rx="1.5" fill="rgba(255,255,255,0.06)"/><rect x="76" y="198" width="40" height="3" rx="1.5" fill="rgba(255,255,255,0.10)"/>
              <rect x="196" y="146" width="128" height="82" rx="6" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.04)" stroke-width="0.5"/>
              <text x="212" y="168" font-family="'Hanken Grotesk',sans-serif" font-size="6" font-weight="600" fill="rgba(255,255,255,0.2)" letter-spacing="0.06em">PROGRESS</text>
              <rect x="212" y="178" width="96" height="4" rx="2" fill="rgba(255,255,255,0.05)"/><rect x="212" y="178" width="72" height="4" rx="2" fill="rgba(255,255,255,0.15)"/>
              <rect x="212" y="192" width="96" height="4" rx="2" fill="rgba(255,255,255,0.05)"/><rect x="212" y="192" width="48" height="4" rx="2" fill="rgba(255,255,255,0.12)"/>
              <!-- Stats bubble -->
              <rect x="60" y="236" width="264" height="24" rx="5" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.04)" stroke-width="0.5"/>
              <circle cx="76" cy="248" r="3" fill="rgba(255,255,255,0.3)"/>
              <text x="84" y="251" font-family="'Hanken Grotesk',sans-serif" font-size="6" font-weight="600" fill="rgba(255,255,255,0.45)">24 tasks this week</text>
              <circle cx="190" cy="248" r="2" fill="rgba(255,255,255,0.15)"/>
              <text x="196" y="251" font-family="'Hanken Grotesk',sans-serif" font-size="5.5" fill="rgba(255,255,255,0.25)">18h logged</text>
              <circle cx="266" cy="248" r="2" fill="rgba(255,255,255,0.12)"/>
              <text x="272" y="251" font-family="'Hanken Grotesk',sans-serif" font-size="5.5" fill="rgba(255,255,255,0.25)">7d streak</text>
            </svg>
          </div>

          <!-- Slide 3: Finance -->
          <div class="auth-carousel-slide">
            <svg viewBox="0 0 480 340" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="480" height="340" rx="14" fill="#0a0a0a"/>
              <rect x="0.5" y="0.5" width="479" height="339" rx="13.5" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>
              <rect x="0" y="0" width="480" height="38" rx="14" fill="rgba(255,255,255,0.03)"/>
              <circle cx="18" cy="15" r="3" fill="rgba(255,255,255,0.12)"/><circle cx="30" cy="15" r="3" fill="rgba(255,255,255,0.08)"/><circle cx="42" cy="15" r="3" fill="rgba(255,255,255,0.06)"/>
              <text x="240" y="19" text-anchor="middle" font-family="'Hanken Grotesk',sans-serif" font-size="8" font-weight="600" fill="rgba(255,255,255,0.2)" letter-spacing="0.08em">FINANCE</text>
              <!-- KPIs -->
              <rect x="24" y="56" width="208" height="52" rx="6" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.04)" stroke-width="0.5"/>
              <text x="40" y="76" font-family="'Hanken Grotesk',sans-serif" font-size="6" fill="rgba(255,255,255,0.2)" letter-spacing="0.04em">INCOME THIS MONTH</text>
              <text x="40" y="96" font-family="'Space Grotesk',monospace" font-size="14" font-weight="600" fill="rgba(255,255,255,0.6)">$3,240</text>
              <rect x="248" y="56" width="208" height="52" rx="6" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.04)" stroke-width="0.5"/>
              <text x="264" y="76" font-family="'Hanken Grotesk',sans-serif" font-size="6" fill="rgba(255,255,255,0.2)" letter-spacing="0.04em">EXPENSES THIS MONTH</text>
              <text x="264" y="96" font-family="'Space Grotesk',monospace" font-size="14" font-weight="600" fill="rgba(255,255,255,0.6)">$1,870</text>
              <!-- Wallet + Piggy -->
              <rect x="24" y="120" width="130" height="68" rx="6" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.04)" stroke-width="0.5"/>
              <text x="40" y="140" font-family="'Hanken Grotesk',sans-serif" font-size="6" fill="rgba(255,255,255,0.2)" letter-spacing="0.04em">WALLET</text>
              <text x="40" y="162" font-family="'Space Grotesk',monospace" font-size="11" font-weight="600" fill="rgba(255,255,255,0.5)">$520</text>
              <rect x="170" y="120" width="130" height="68" rx="6" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.04)" stroke-width="0.5"/>
              <text x="186" y="140" font-family="'Hanken Grotesk',sans-serif" font-size="6" fill="rgba(255,255,255,0.2)" letter-spacing="0.04em">PIGGY BANK</text>
              <text x="186" y="162" font-family="'Space Grotesk',monospace" font-size="11" font-weight="600" fill="rgba(255,255,255,0.5)">$1,370</text>
              <!-- Chart -->
              <rect x="24" y="200" width="432" height="56" rx="6" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.04)" stroke-width="0.5"/>
              <text x="40" y="218" font-family="'Hanken Grotesk',sans-serif" font-size="6" fill="rgba(255,255,255,0.2)" letter-spacing="0.04em">DAILY BALANCE</text>
              <rect x="50" y="228" width="16" height="16" rx="2" fill="rgba(255,255,255,0.08)"/><rect x="74" y="220" width="16" height="24" rx="2" fill="rgba(255,255,255,0.12)"/>
              <rect x="98" y="232" width="16" height="12" rx="2" fill="rgba(255,255,255,0.06)"/><rect x="122" y="216" width="16" height="28" rx="2" fill="rgba(255,255,255,0.10)"/>
              <rect x="146" y="224" width="16" height="20" rx="2" fill="rgba(255,255,255,0.08)"/><rect x="170" y="210" width="16" height="34" rx="2" fill="rgba(255,255,255,0.14)"/>
              <rect x="194" y="226" width="16" height="18" rx="2" fill="rgba(255,255,255,0.06)"/><rect x="218" y="222" width="16" height="22" rx="2" fill="rgba(255,255,255,0.08)"/>
              <!-- Categories -->
              <rect x="24" y="268" width="80" height="16" rx="8" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.05)" stroke-width="0.5"/><text x="32" y="279" font-family="'Hanken Grotesk',sans-serif" font-size="5.5" fill="rgba(255,255,255,0.25)">Housing</text>
              <rect x="110" y="268" width="66" height="16" rx="8" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.05)" stroke-width="0.5"/><text x="118" y="279" font-family="'Hanken Grotesk',sans-serif" font-size="5.5" fill="rgba(255,255,255,0.25)">Food</text>
              <rect x="182" y="268" width="58" height="16" rx="8" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.05)" stroke-width="0.5"/><text x="190" y="279" font-family="'Hanken Grotesk',sans-serif" font-size="5.5" fill="rgba(255,255,255,0.25)">Health</text>
              <rect x="246" y="268" width="74" height="16" rx="8" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.05)" stroke-width="0.5"/><text x="254" y="279" font-family="'Hanken Grotesk',sans-serif" font-size="5.5" fill="rgba(255,255,255,0.25)">Transport</text>
            </svg>
          </div>

          <!-- Slide 4: Analytics -->
          <div class="auth-carousel-slide">
            <svg viewBox="0 0 480 340" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="480" height="340" rx="14" fill="#0a0a0a"/>
              <rect x="0.5" y="0.5" width="479" height="339" rx="13.5" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>
              <rect x="0" y="0" width="480" height="38" rx="14" fill="rgba(255,255,255,0.03)"/>
              <circle cx="18" cy="15" r="3" fill="rgba(255,255,255,0.12)"/><circle cx="30" cy="15" r="3" fill="rgba(255,255,255,0.08)"/><circle cx="42" cy="15" r="3" fill="rgba(255,255,255,0.06)"/>
              <text x="240" y="19" text-anchor="middle" font-family="'Hanken Grotesk',sans-serif" font-size="8" font-weight="600" fill="rgba(255,255,255,0.2)" letter-spacing="0.08em">ANALYTICS</text>
              <!-- KPI cards -->
              <rect x="24" y="52" width="100" height="48" rx="6" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.04)" stroke-width="0.5"/>
              <text x="40" y="72" font-family="'Hanken Grotesk',sans-serif" font-size="5.5" fill="rgba(255,255,255,0.2)">TASKS</text>
              <text x="40" y="90" font-family="'Space Grotesk',monospace" font-size="13" font-weight="600" fill="rgba(255,255,255,0.55)">24</text>
              <rect x="136" y="52" width="100" height="48" rx="6" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.04)" stroke-width="0.5"/>
              <text x="152" y="72" font-family="'Hanken Grotesk',sans-serif" font-size="5.5" fill="rgba(255,255,255,0.2)">FOCUS</text>
              <text x="152" y="90" font-family="'Space Grotesk',monospace" font-size="13" font-weight="600" fill="rgba(255,255,255,0.55)">18h</text>
              <rect x="248" y="52" width="100" height="48" rx="6" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.04)" stroke-width="0.5"/>
              <text x="264" y="72" font-family="'Hanken Grotesk',sans-serif" font-size="5.5" fill="rgba(255,255,255,0.2)">STREAK</text>
              <text x="264" y="90" font-family="'Space Grotesk',monospace" font-size="13" font-weight="600" fill="rgba(255,255,255,0.55)">7d</text>
              <rect x="360" y="52" width="96" height="48" rx="6" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.04)" stroke-width="0.5"/>
              <text x="376" y="72" font-family="'Hanken Grotesk',sans-serif" font-size="5.5" fill="rgba(255,255,255,0.2)">DEEP</text>
              <text x="376" y="90" font-family="'Space Grotesk',monospace" font-size="13" font-weight="600" fill="rgba(255,255,255,0.55)">8h</text>
              <!-- Bar chart -->
              <rect x="24" y="114" width="432" height="100" rx="6" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.04)" stroke-width="0.5"/>
              <text x="40" y="134" font-family="'Hanken Grotesk',sans-serif" font-size="6" fill="rgba(255,255,255,0.2)" letter-spacing="0.04em">WEEKLY BREAKDOWN</text>
              <rect x="50" y="150" width="30" height="48" rx="3" fill="rgba(255,255,255,0.14)"/>
              <rect x="90" y="130" width="30" height="68" rx="3" fill="rgba(255,255,255,0.10)"/>
              <rect x="130" y="160" width="30" height="38" rx="3" fill="rgba(255,255,255,0.18)"/>
              <rect x="170" y="140" width="30" height="58" rx="3" fill="rgba(255,255,255,0.12)"/>
              <rect x="210" y="155" width="30" height="43" rx="3" fill="rgba(255,255,255,0.15)"/>
              <rect x="250" y="165" width="30" height="33" rx="3" fill="rgba(255,255,255,0.08)"/>
              <rect x="290" y="145" width="30" height="53" rx="3" fill="rgba(255,255,255,0.13)"/>
              <text x="65" y="212" text-anchor="middle" font-family="'Hanken Grotesk',sans-serif" font-size="5" fill="rgba(255,255,255,0.12)">Mon</text>
              <text x="105" y="212" text-anchor="middle" font-family="'Hanken Grotesk',sans-serif" font-size="5" fill="rgba(255,255,255,0.12)">Tue</text>
              <text x="145" y="212" text-anchor="middle" font-family="'Hanken Grotesk',sans-serif" font-size="5" fill="rgba(255,255,255,0.12)">Wed</text>
              <text x="185" y="212" text-anchor="middle" font-family="'Hanken Grotesk',sans-serif" font-size="5" fill="rgba(255,255,255,0.12)">Thu</text>
              <text x="225" y="212" text-anchor="middle" font-family="'Hanken Grotesk',sans-serif" font-size="5" fill="rgba(255,255,255,0.12)">Fri</text>
              <!-- Tags -->
              <rect x="24" y="230" width="60" height="16" rx="8" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.05)" stroke-width="0.5"/><text x="32" y="241" font-family="'Hanken Grotesk',sans-serif" font-size="5.5" fill="rgba(255,255,255,0.25)">Weekly</text>
              <rect x="90" y="230" width="56" height="16" rx="8" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.05)" stroke-width="0.5"/><text x="98" y="241" font-family="'Hanken Grotesk',sans-serif" font-size="5.5" fill="rgba(255,255,255,0.25)">Monthly</text>
              <rect x="152" y="230" width="44" height="16" rx="8" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.05)" stroke-width="0.5"/><text x="160" y="241" font-family="'Hanken Grotesk',sans-serif" font-size="5.5" fill="rgba(255,255,255,0.25)">All</text>
            </svg>
          </div>

          <!-- Slide 5: Goals -->
          <div class="auth-carousel-slide">
            <svg viewBox="0 0 480 340" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="480" height="340" rx="14" fill="#0a0a0a"/>
              <rect x="0.5" y="0.5" width="479" height="339" rx="13.5" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>
              <rect x="0" y="0" width="480" height="38" rx="14" fill="rgba(255,255,255,0.03)"/>
              <circle cx="18" cy="15" r="3" fill="rgba(255,255,255,0.12)"/><circle cx="30" cy="15" r="3" fill="rgba(255,255,255,0.08)"/><circle cx="42" cy="15" r="3" fill="rgba(255,255,255,0.06)"/>
              <text x="240" y="19" text-anchor="middle" font-family="'Hanken Grotesk',sans-serif" font-size="8" font-weight="600" fill="rgba(255,255,255,0.2)" letter-spacing="0.08em">GOALS</text>
              <!-- Goal cards -->
              <rect x="24" y="56" width="208" height="68" rx="6" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.04)" stroke-width="0.5"/>
              <rect x="36" y="68" width="14" height="14" rx="4" fill="rgba(255,255,255,0.08)"/><text x="56" y="79" font-family="'Hanken Grotesk',sans-serif" font-size="6" font-weight="500" fill="rgba(255,255,255,0.3)">Learn TypeScript</text>
              <rect x="36" y="90" width="180" height="4" rx="2" fill="rgba(255,255,255,0.05)"/><rect x="36" y="90" width="153" height="4" rx="2" fill="rgba(255,255,255,0.18)"/>
              <text x="180" y="100" font-family="'Space Grotesk',monospace" font-size="5" fill="rgba(255,255,255,0.2)">85%</text>
              <rect x="36" y="104" width="14" height="14" rx="4" fill="rgba(255,255,255,0.06)"/><text x="56" y="115" font-family="'Hanken Grotesk',sans-serif" font-size="6" font-weight="500" fill="rgba(255,255,255,0.3)">Read 12 Books</text>
              <rect x="36" y="126" width="180" height="4" rx="2" fill="rgba(255,255,255,0.05)"/><rect x="36" y="126" width="99" height="4" rx="2" fill="rgba(255,255,255,0.12)"/>
              <text x="180" y="136" font-family="'Space Grotesk',monospace" font-size="5" fill="rgba(255,255,255,0.2)">55%</text>
              <rect x="24" y="136" width="208" height="68" rx="6" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.04)" stroke-width="0.5"/>
              <rect x="248" y="56" width="208" height="68" rx="6" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.04)" stroke-width="0.5"/>
              <text x="260" y="76" font-family="'Hanken Grotesk',sans-serif" font-size="6" font-weight="500" fill="rgba(255,255,255,0.3)">Run a Marathon</text>
              <rect x="260" y="84" width="180" height="4" rx="2" fill="rgba(255,255,255,0.05)"/><rect x="260" y="84" width="54" height="4" rx="2" fill="rgba(255,255,255,0.10)"/>
              <text x="404" y="94" font-family="'Space Grotesk',monospace" font-size="5" fill="rgba(255,255,255,0.2)">30%</text>
              <rect x="260" y="104" width="14" height="14" rx="4" fill="rgba(255,255,255,0.08)"/><text x="280" y="115" font-family="'Hanken Grotesk',sans-serif" font-size="6" font-weight="500" fill="rgba(255,255,255,0.3)">Save $5,000</text>
              <rect x="260" y="126" width="180" height="4" rx="2" fill="rgba(255,255,255,0.05)"/><rect x="260" y="126" width="108" height="4" rx="2" fill="rgba(255,255,255,0.14)"/>
              <text x="404" y="136" font-family="'Space Grotesk',monospace" font-size="5" fill="rgba(255,255,255,0.2)">60%</text>
              <rect x="248" y="136" width="208" height="68" rx="6" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.04)" stroke-width="0.5"/>
              <!-- Vision board preview -->
              <rect x="24" y="218" width="432" height="40" rx="6" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.04)" stroke-width="0.5"/>
              <rect x="36" y="228" width="56" height="20" rx="3" fill="rgba(255,255,255,0.04)"/>
              <rect x="100" y="228" width="56" height="20" rx="3" fill="rgba(255,255,255,0.03)"/>
              <rect x="164" y="228" width="56" height="20" rx="3" fill="rgba(255,255,255,0.04)"/>
              <text x="260" y="243" font-family="'Hanken Grotesk',sans-serif" font-size="5.5" fill="rgba(255,255,255,0.2)">Vision Board</text>
              <!-- Tags -->
              <rect x="24" y="272" width="56" height="16" rx="8" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.05)" stroke-width="0.5"/><text x="32" y="283" font-family="'Hanken Grotesk',sans-serif" font-size="5.5" fill="rgba(255,255,255,0.25)">Yearly</text>
              <rect x="86" y="272" width="56" height="16" rx="8" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.05)" stroke-width="0.5"/><text x="94" y="283" font-family="'Hanken Grotesk',sans-serif" font-size="5.5" fill="rgba(255,255,255,0.25)">Monthly</text>
              <rect x="148" y="272" width="56" height="16" rx="8" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.05)" stroke-width="0.5"/><text x="156" y="283" font-family="'Hanken Grotesk',sans-serif" font-size="5.5" fill="rgba(255,255,255,0.25)">Weekly</text>
            </svg>
          </div>

          <!-- Slide 6: Activities -->
          <div class="auth-carousel-slide">
            <svg viewBox="0 0 480 340" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="480" height="340" rx="14" fill="#0a0a0a"/>
              <rect x="0.5" y="0.5" width="479" height="339" rx="13.5" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>
              <rect x="0" y="0" width="480" height="38" rx="14" fill="rgba(255,255,255,0.03)"/>
              <circle cx="18" cy="15" r="3" fill="rgba(255,255,255,0.12)"/><circle cx="30" cy="15" r="3" fill="rgba(255,255,255,0.08)"/><circle cx="42" cy="15" r="3" fill="rgba(255,255,255,0.06)"/>
              <text x="240" y="19" text-anchor="middle" font-family="'Hanken Grotesk',sans-serif" font-size="8" font-weight="600" fill="rgba(255,255,255,0.2)" letter-spacing="0.08em">ACTIVITIES</text>
              <!-- Board columns -->
              <rect x="20" y="52" width="140" height="206" rx="6" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.04)" stroke-width="0.5"/>
              <text x="90" y="72" text-anchor="middle" font-family="'Hanken Grotesk',sans-serif" font-size="6" font-weight="600" fill="rgba(255,255,255,0.2)" letter-spacing="0.06em">DEEP WORK</text>
              <rect x="32" y="80" width="116" height="32" rx="4" fill="rgba(255,255,255,0.10)" stroke="rgba(255,255,255,0.06)" stroke-width="0.5"/>
              <text x="44" y="95" font-family="'Hanken Grotesk',sans-serif" font-size="5" fill="rgba(255,255,255,0.35)">Design sprint</text>
              <text x="44" y="104" font-family="'Hanken Grotesk',sans-serif" font-size="4.5" fill="rgba(255,255,255,0.15)">2h</text>
              <rect x="32" y="120" width="116" height="32" rx="4" fill="rgba(255,255,255,0.10)" stroke="rgba(255,255,255,0.06)" stroke-width="0.5"/>
              <text x="44" y="135" font-family="'Hanken Grotesk',sans-serif" font-size="5" fill="rgba(255,255,255,0.35)">Code review</text>
              <text x="44" y="144" font-family="'Hanken Grotesk',sans-serif" font-size="4.5" fill="rgba(255,255,255,0.15)">1.5h</text>
              <rect x="32" y="160" width="116" height="32" rx="4" fill="rgba(255,255,255,0.10)" stroke="rgba(255,255,255,0.06)" stroke-width="0.5"/>
              <text x="44" y="175" font-family="'Hanken Grotesk',sans-serif" font-size="5" fill="rgba(255,255,255,0.35)">Research</text>
              <text x="44" y="184" font-family="'Hanken Grotesk',sans-serif" font-size="4.5" fill="rgba(255,255,255,0.15)">1h</text>
              <rect x="170" y="52" width="140" height="206" rx="6" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.04)" stroke-width="0.5"/>
              <text x="240" y="72" text-anchor="middle" font-family="'Hanken Grotesk',sans-serif" font-size="6" font-weight="600" fill="rgba(255,255,255,0.2)" letter-spacing="0.06em">MEETINGS</text>
              <rect x="182" y="80" width="116" height="32" rx="4" fill="rgba(255,255,255,0.07)" stroke="rgba(255,255,255,0.05)" stroke-width="0.5"/>
              <text x="194" y="95" font-family="'Hanken Grotesk',sans-serif" font-size="5" fill="rgba(255,255,255,0.3)">Standup</text>
              <text x="194" y="104" font-family="'Hanken Grotesk',sans-serif" font-size="4.5" fill="rgba(255,255,255,0.15)">30m</text>
              <rect x="182" y="120" width="116" height="32" rx="4" fill="rgba(255,255,255,0.07)" stroke="rgba(255,255,255,0.05)" stroke-width="0.5"/>
              <text x="194" y="135" font-family="'Hanken Grotesk',sans-serif" font-size="5" fill="rgba(255,255,255,0.3)">1:1</text>
              <text x="194" y="144" font-family="'Hanken Grotesk',sans-serif" font-size="4.5" fill="rgba(255,255,255,0.15)">30m</text>
              <rect x="320" y="52" width="140" height="206" rx="6" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.04)" stroke-width="0.5"/>
              <text x="390" y="72" text-anchor="middle" font-family="'Hanken Grotesk',sans-serif" font-size="6" font-weight="600" fill="rgba(255,255,255,0.2)" letter-spacing="0.06em">HEALTH</text>
              <rect x="332" y="80" width="116" height="32" rx="4" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.04)" stroke-width="0.5"/>
              <text x="344" y="95" font-family="'Hanken Grotesk',sans-serif" font-size="5" fill="rgba(255,255,255,0.3)">Run</text>
              <text x="344" y="104" font-family="'Hanken Grotesk',sans-serif" font-size="4.5" fill="rgba(255,255,255,0.15)">5k</text>
              <rect x="332" y="120" width="116" height="32" rx="4" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.04)" stroke-width="0.5"/>
              <text x="344" y="135" font-family="'Hanken Grotesk',sans-serif" font-size="5" fill="rgba(255,255,255,0.3)">Gym</text>
              <text x="344" y="144" font-family="'Hanken Grotesk',sans-serif" font-size="4.5" fill="rgba(255,255,255,0.15)">1h</text>
              <!-- Activity log -->
              <rect x="20" y="272" width="440" height="20" rx="4" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.04)" stroke-width="0.5"/>
              <circle cx="36" cy="282" r="3" fill="rgba(255,255,255,0.15)"/>
              <text x="44" y="285" font-family="'Hanken Grotesk',sans-serif" font-size="5.5" fill="rgba(255,255,255,0.25)">Completed today: 6 activities · 5h 30m total</text>
            </svg>
          </div>

        </div>
      </div>
      <!-- Carousel dots -->
      <div class="auth-carousel-dots" id="carouselDots">
        <button class="auth-carousel-dot active" data-index="0"></button>
        <button class="auth-carousel-dot" data-index="1"></button>
        <button class="auth-carousel-dot" data-index="2"></button>
        <button class="auth-carousel-dot" data-index="3"></button>
        <button class="auth-carousel-dot" data-index="4"></button>
        <button class="auth-carousel-dot" data-index="5"></button>
      </div>'''

# Replace from start to end
new_content = content[:start_idx] + carousel_html + content[end_idx:]

with open('login.html', 'w', encoding='utf-8') as f:
    f.write(new_content)

print("SUCCESS: Replaced SVG with carousel in login.html")
