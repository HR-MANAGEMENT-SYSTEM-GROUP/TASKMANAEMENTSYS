/**
 * ============================================================================
 * EMPLOYEE ID BADGE ANIMATIONS & PHYSICS ENGINE (animations.js)
 * ============================================================================
 * This file contains ALL visual animations and physics for the login page:
 * - Hanging lanyard SVG physics & pendulum sway
 * - 3D card tilt & parallax following mouse cursor
 * - Badge drop-in entrance animation
 * - 3D card flip when focusing on the password field
 * - Padlock unlock animation when password visibility is toggled
 * - Error shake & red pulse animation
 * - Live name & initials sync on the badge as the user types
 * ============================================================================
 */

(function () {
  'use strict';

  // --------------------------------------------------------------------------
  // 1. CONFIGURATION
  // --------------------------------------------------------------------------
  const CONFIG = {
    idleSwayDeg: 0.8,
    idleSwayPeriodS: 6,
    tiltMaxDeg: 8,
    tiltLerp: 0.08,
    springK: 12,
    springC: 2.0,
    followK: 9,
    followC: 1.6,
    dragMaxDeg: 25,
    dropMs: 1000,
    parallaxPx: 6,
    floatPx: 4,
    floatPeriodS: 7,
    swingSign: -1
  };
  const SWING_SIGN = CONFIG.swingSign;

  // --------------------------------------------------------------------------
  // 2. DOM ELEMENT REFERENCES
  // --------------------------------------------------------------------------
  const badgePanel = document.querySelector('.lb-badge-panel');
  const badgeAssembly = document.getElementById('badgeAssembly');
  const badgeTilt = document.getElementById('badgeTilt');
  const badgeCard = document.getElementById('badgeCard');
  const badgeShadow = document.getElementById('badgeShadow');
  const badgeName = document.getElementById('badgeName');
  const badgeInitials = document.getElementById('badgeInitials');
  const lanyardLeftStrap = document.getElementById('lanyardLeftStrap');
  const lanyardRightStrap = document.getElementById('lanyardRightStrap');
  const lanyardClip = document.getElementById('lanyardClip');
  const padlockBody = document.getElementById('padlockBody');

  // Input references for animation hooks
  const loginForm = document.getElementById('hrLoginForm');
  const emailInput = document.getElementById('loginEmail');
  const passwordInput = document.getElementById('loginPassword');
  const togglePasswordBtn = document.getElementById('togglePasswordBtn');
  const emailError = document.getElementById('emailError');
  const passwordError = document.getElementById('passwordError');
  const loginSubmitBtn = document.getElementById('loginSubmitBtn');

  if (!badgePanel || !badgeAssembly || !badgeCard) return;

  // Accessibility & pointer preferences
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');

  // --------------------------------------------------------------------------
  // 3. PHYSICS SIMULATION STATE
  // --------------------------------------------------------------------------
  let angle = 0;              // Pendulum angle in degrees (capped at ±10)
  let velocity = 0;           // Angular velocity in deg/s (capped at ±30)
  let lanyardAngle = 0;       // Lanyard follow spring angle
  let lanyardVelocity = 0;    // Lanyard follow spring velocity
  let tiltX = 0;              // 3D pitch tilt
  let tiltY = 0;              // 3D roll tilt
  let targetTiltX = 0;
  let targetTiltY = 0;
  let parallaxX = 0;          // Parallax X offset
  let parallaxY = 0;          // Parallax Y offset
  let targetParallaxX = 0;
  let targetParallaxY = 0;

  const fixedDt = 1 / 60;     // 60fps fixed physics timestep

  // Pointer and drag tracking
  let isDragging = false;
  let isPointerOverPanel = false;
  let isFirstSample = false;
  let lastPointerX = 0;
  let lastPointerY = 0;
  let lastPointerTime = performance.now();
  let smoothedVx = 0;

  // Cached positions
  let cachedPivotX = 0;
  let cachedPivotY = 0;
  let cachedPanelCenterX = 0;
  let cachedPanelCenterY = 0;
  let cachedPanelHalfWidth = 1;
  let cachedPanelHalfHeight = 1;

  let rafId = null;
  let isLoopActive = false;

  // --------------------------------------------------------------------------
  // 4. METRICS & RESIZE OBSERVER
  // --------------------------------------------------------------------------
  function updateCachedMetrics() {
    if (!badgeAssembly || !badgePanel) return;
    const panelRect = badgePanel.getBoundingClientRect();
    const assemblyRect = badgeAssembly.getBoundingClientRect();

    cachedPivotX = assemblyRect.left + assemblyRect.width / 2;
    cachedPivotY = assemblyRect.top;

    cachedPanelCenterX = panelRect.left + panelRect.width / 2;
    cachedPanelCenterY = panelRect.top + panelRect.height / 2;
    cachedPanelHalfWidth = panelRect.width / 2 || 1;
    cachedPanelHalfHeight = panelRect.height / 2 || 1;
  }

  if (window.ResizeObserver) {
    const ro = new ResizeObserver(updateCachedMetrics);
    ro.observe(badgePanel);
    ro.observe(badgeAssembly);
  }
  window.addEventListener('resize', updateCachedMetrics, { passive: true });
  window.addEventListener('scroll', updateCachedMetrics, { passive: true });
  updateCachedMetrics();

  // --------------------------------------------------------------------------
  // 5. LANYARD SVG PATH UPDATE
  // --------------------------------------------------------------------------
  function updateLanyardVisual(currentLanyardAngle) {
    if (!lanyardLeftStrap || !lanyardRightStrap || !lanyardClip) return;

    const anchorCenterX = 200;
    const anchorY = 0;
    const leftAnchorX = anchorCenterX - 48;
    const rightAnchorX = anchorCenterX + 48;

    const swingDeg = SWING_SIGN * currentLanyardAngle;
    const length = 98;
    const rad = (swingDeg * Math.PI) / 180;
    const clipX = anchorCenterX + length * Math.sin(rad);
    const clipY = length * Math.cos(rad);

    const midY = clipY * 0.52;
    const bendOffset = swingDeg * 0.35;

    const leftD = `M ${leftAnchorX} ${anchorY} Q ${anchorCenterX - 24 + bendOffset} ${midY} ${clipX - 4} ${clipY}`;
    const rightD = `M ${rightAnchorX} ${anchorY} Q ${anchorCenterX + 24 + bendOffset} ${midY} ${clipX + 4} ${clipY}`;

    lanyardLeftStrap.setAttribute('d', leftD);
    lanyardRightStrap.setAttribute('d', rightD);
    lanyardClip.setAttribute('transform', `translate(${clipX.toFixed(1)}, ${clipY.toFixed(1)}) rotate(${swingDeg.toFixed(1)})`);
  }

  // --------------------------------------------------------------------------
  // 6. PHYSICS TICK LOOP
  // --------------------------------------------------------------------------
  function tickPhysics() {
    if (document.hidden) {
      isLoopActive = false;
      return;
    }

    if (!isDragging) {
      // Damped spring pendulum for the badge
      const acceleration = -CONFIG.springK * angle - CONFIG.springC * velocity;
      velocity += acceleration * fixedDt;
      angle += velocity * fixedDt;

      velocity = Math.max(-30, Math.min(30, velocity));
      angle = Math.max(-10, Math.min(10, angle));
    }

    // Follow-through spring for the lanyard
    const followAccel = -CONFIG.followK * (lanyardAngle - angle) - CONFIG.followC * lanyardVelocity;
    lanyardVelocity += followAccel * fixedDt;
    lanyardAngle += lanyardVelocity * fixedDt;

    // Smooth tilt interpolation
    tiltX += (targetTiltX - tiltX) * CONFIG.tiltLerp;
    tiltY += (targetTiltY - tiltY) * CONFIG.tiltLerp;

    // Parallax interpolation
    parallaxX += (targetParallaxX - parallaxX) * CONFIG.tiltLerp;
    parallaxY += (targetParallaxY - parallaxY) * CONFIG.tiltLerp;

    if (badgePanel) {
      badgePanel.style.setProperty('--p-x', `${parallaxX.toFixed(2)}px`);
      badgePanel.style.setProperty('--p-y', `${parallaxY.toFixed(2)}px`);
    }

    // Shadow adjustment based on tilt
    if (badgeShadow) {
      const normX = targetTiltY / CONFIG.tiltMaxDeg;
      const normY = -targetTiltX / CONFIG.tiltMaxDeg;
      const shadowX = -normX * 10;
      const shadowY = -normY * 6;
      const shadowBlur = 8 + (Math.abs(normX) + Math.abs(normY)) * 2;
      const shadowScale = 1 + (Math.abs(normX) + Math.abs(normY)) * 0.05;
      badgeShadow.style.transform = `translate(${shadowX.toFixed(1)}px, ${shadowY.toFixed(1)}px) scale(${shadowScale.toFixed(2)})`;
      badgeShadow.style.filter = `blur(${shadowBlur.toFixed(1)}px)`;
    }

    // Apply transforms if motion is allowed
    if (!prefersReducedMotion.matches) {
      badgeAssembly.style.transform = `rotate(${angle.toFixed(2)}deg)`;

      if (badgeTilt) {
        badgeTilt.style.transform = (tiltX === 0 && tiltY === 0)
          ? ''
          : `rotateX(${tiltX.toFixed(2)}deg) rotateY(${tiltY.toFixed(2)}deg)`;
      }

      updateLanyardVisual(lanyardAngle);
    }

    // Check if settled
    const isPhysicsSettled = Math.abs(angle) < 0.05 && Math.abs(velocity) < 0.5;
    const isLanyardSettled = Math.abs(lanyardAngle - angle) < 0.05 && Math.abs(lanyardVelocity) < 0.5;
    const isTiltSettled = Math.abs(targetTiltX - tiltX) < 0.05 && Math.abs(targetTiltY - tiltY) < 0.05;
    const isParallaxSettled = Math.abs(targetParallaxX - parallaxX) < 0.08 && Math.abs(targetParallaxY - parallaxY) < 0.08;
    const isPointerIdle = (performance.now() - lastPointerTime) > 80;

    if (!isDragging && isPhysicsSettled && isLanyardSettled && isTiltSettled && isParallaxSettled && (!isPointerOverPanel || isPointerIdle)) {
      angle = 0;
      velocity = 0;
      lanyardAngle = 0;
      lanyardVelocity = 0;
      tiltX = targetTiltX;
      tiltY = targetTiltY;
      parallaxX = targetParallaxX;
      parallaxY = targetParallaxY;

      if (!prefersReducedMotion.matches) {
        badgeAssembly.style.transform = 'rotate(0deg)';
        if (badgeTilt) {
          badgeTilt.style.transform = (tiltX === 0 && tiltY === 0)
            ? ''
            : `rotateX(${tiltX.toFixed(2)}deg) rotateY(${tiltY.toFixed(2)}deg)`;
        }
        updateLanyardVisual(0);
      }
      isLoopActive = false;
      return;
    }

    rafId = requestAnimationFrame(tickPhysics);
  }

  function startPhysicsLoop() {
    if (!isLoopActive) {
      isLoopActive = true;
      rafId = requestAnimationFrame(tickPhysics);
    }
  }

  // --------------------------------------------------------------------------
  // 7. DROP-IN ENTRANCE ANIMATION
  // --------------------------------------------------------------------------
  let hasDropped = false;
  function triggerDropIn() {
    if (hasDropped) return;
    hasDropped = true;

    if (prefersReducedMotion.matches) {
      updateLanyardVisual(0);
      badgeCard.classList.add('is-landed');
      return;
    }

    badgeAssembly.classList.add('is-dropping');

    const revealDelay = Math.min(480, Math.round(CONFIG.dropMs * 0.48));
    setTimeout(() => {
      badgeCard.classList.add('is-landed');
    }, revealDelay);

    setTimeout(() => {
      badgeAssembly.classList.remove('is-dropping');
      badgeCard.classList.add('is-landed');
      velocity = SWING_SIGN * -18.0;
      startPhysicsLoop();
    }, CONFIG.dropMs);
  }

  // --------------------------------------------------------------------------
  // 8. POINTER & DRAGGING INTERACTIONS
  // --------------------------------------------------------------------------
  function onPointerMove(e) {
    if (prefersReducedMotion.matches) return;
    if (e.pointerType === 'touch' || !finePointer.matches) return;

    const rect = badgePanel.getBoundingClientRect();
    const isInside = (
      e.clientX >= rect.left && e.clientX <= rect.right &&
      e.clientY >= rect.top && e.clientY <= rect.bottom
    );

    const nowTime = e.timeStamp || performance.now();

    if (isInside && !isPointerOverPanel) {
      isPointerOverPanel = true;
      badgePanel.classList.add('is-pointer-inside');
      lastPointerX = e.clientX;
      lastPointerY = e.clientY;
      lastPointerTime = nowTime;
      smoothedVx = 0;
      velocity = 0;
      isFirstSample = true;
      return;
    }

    if (!isInside && isPointerOverPanel) {
      isPointerOverPanel = false;
      badgePanel.classList.remove('is-pointer-inside');
      velocity = 0;
      targetTiltX = 0;
      targetTiltY = 0;
      targetParallaxX = 0;
      targetParallaxY = 0;
      smoothedVx = 0;
      startPhysicsLoop();
      return;
    }

    if (!isInside && !isDragging) {
      targetTiltX = 0;
      targetTiltY = 0;
      targetParallaxX = 0;
      targetParallaxY = 0;
      return;
    }

    const dtMs = Math.max(8, nowTime - lastPointerTime);
    const dtSec = dtMs / 1000;
    const rawVx = (e.clientX - lastPointerX) / dtSec;

    lastPointerX = e.clientX;
    lastPointerY = e.clientY;
    lastPointerTime = nowTime;

    if (isFirstSample) {
      isFirstSample = false;
      smoothedVx = 0;
      return;
    }

    smoothedVx = 0.2 * rawVx + 0.8 * smoothedVx;
    const clampedVx = Math.max(-800, Math.min(800, smoothedVx));
    const effectiveVx = Math.abs(clampedVx) >= 40 ? clampedVx : 0;

    if (isDragging) {
      const dx = e.clientX - cachedPivotX;
      const dy = Math.max(20, e.clientY - cachedPivotY);
      const rawAngle = Math.atan2(dx, dy) * (180 / Math.PI);
      angle = Math.max(-CONFIG.dragMaxDeg, Math.min(CONFIG.dragMaxDeg, SWING_SIGN * rawAngle));
      velocity = 0;
      startPhysicsLoop();
    } else if (isPointerOverPanel) {
      const normX = Math.max(-1, Math.min(1, (e.clientX - cachedPanelCenterX) / cachedPanelHalfWidth));
      const normY = Math.max(-1, Math.min(1, (e.clientY - cachedPanelCenterY) / cachedPanelHalfHeight));

      targetTiltY = normX * CONFIG.tiltMaxDeg;
      targetTiltX = -normY * CONFIG.tiltMaxDeg;

      targetParallaxX = -normX * CONFIG.parallaxPx;
      targetParallaxY = -normY * CONFIG.parallaxPx;

      if (effectiveVx !== 0) {
        velocity += SWING_SIGN * effectiveVx * 0.015;
        velocity = Math.max(-30, Math.min(30, velocity));
      }

      const sheenX = Math.max(10, Math.min(90, 50 + normX * 35));
      const sheenY = Math.max(10, Math.min(90, 40 + normY * 30));
      badgeCard.style.setProperty('--gx', `${sheenX}%`);
      badgeCard.style.setProperty('--gy', `${sheenY}%`);
      badgeCard.style.setProperty('--glare-x', `${sheenX}%`);
      badgeCard.style.setProperty('--glare-y', `${sheenY}%`);

      startPhysicsLoop();
    }
  }

  badgePanel.addEventListener('pointerenter', (e) => {
    if (e.pointerType === 'touch' || !finePointer.matches) return;
    isPointerOverPanel = true;
    badgePanel.classList.add('is-pointer-inside');
    lastPointerX = e.clientX;
    lastPointerY = e.clientY;
    lastPointerTime = e.timeStamp || performance.now();
    smoothedVx = 0;
    velocity = 0;
    isFirstSample = true;
  });

  badgePanel.addEventListener('pointerleave', (e) => {
    if (e.pointerType === 'touch' || !finePointer.matches) return;
    isPointerOverPanel = false;
    badgePanel.classList.remove('is-pointer-inside');
    velocity = 0;
    targetTiltX = 0;
    targetTiltY = 0;
    targetParallaxX = 0;
    targetParallaxY = 0;
    smoothedVx = 0;
    startPhysicsLoop();
  });

  badgeAssembly.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 || prefersReducedMotion.matches || e.pointerType === 'touch') return;
    isDragging = true;
    badgeAssembly.classList.add('is-dragging');
    try {
      badgeAssembly.setPointerCapture(e.pointerId);
    } catch (_) {}
    startPhysicsLoop();
  });

  badgeAssembly.addEventListener('pointerup', (e) => {
    if (!isDragging) return;
    isDragging = false;
    badgeAssembly.classList.remove('is-dragging');
    try {
      badgeAssembly.releasePointerCapture(e.pointerId);
    } catch (_) {}
    const releaseImpulse = Math.max(-30, Math.min(30, SWING_SIGN * smoothedVx * 0.035));
    velocity = releaseImpulse;
    startPhysicsLoop();
  });

  badgeAssembly.addEventListener('pointercancel', () => {
    if (isDragging) {
      isDragging = false;
      badgeAssembly.classList.remove('is-dragging');
      startPhysicsLoop();
    }
  });

  window.addEventListener('pointermove', onPointerMove, { passive: true });

  // --------------------------------------------------------------------------
  // 9. LIVE EMAIL -> BADGE NAME SYNC ANIMATION
  // --------------------------------------------------------------------------
  let lastDisplayedName = '';
  let lastDisplayedInitials = '';
  let lastNameAnimTime = 0;

  function triggerNameTypingAnim() {
    if (prefersReducedMotion.matches) return;
    const now = performance.now();
    if (now - lastNameAnimTime < 120) return;
    lastNameAnimTime = now;

    if (badgeName) {
      badgeName.classList.remove('is-typing');
      void badgeName.offsetWidth;
      badgeName.classList.add('is-typing');
    }
    if (badgeInitials) {
      badgeInitials.classList.remove('is-typing');
      void badgeInitials.offsetWidth;
      badgeInitials.classList.add('is-typing');
    }
  }

  function updateBadgeNameFromEmail() {
    if (!emailInput || !badgeName || !badgeInitials) return;

    const email = emailInput.value.trim();
    if (!email) {
      if (lastDisplayedName !== 'Your name' || lastDisplayedInitials !== 'YN') {
        lastDisplayedName = 'Your name';
        lastDisplayedInitials = 'YN';
        badgeName.textContent = 'Your name';
        badgeInitials.textContent = 'YN';
        triggerNameTypingAnim();
      }
      return;
    }

    const localPart = email.split('@')[0] || '';
    const cleanPart = localPart.replace(/[0-9]/g, '');
    const tokens = cleanPart.split(/[._\-+]/).filter(Boolean);

    let formattedName = '';
    let initials = '';

    if (tokens.length >= 2) {
      const first = tokens[0].charAt(0).toUpperCase() + tokens[0].slice(1).toLowerCase();
      const last = tokens[1].charAt(0).toUpperCase() + tokens[1].slice(1).toLowerCase();
      formattedName = `${first} ${last}`;
      initials = `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
    } else if (tokens.length === 1 && tokens[0].length > 0) {
      const single = tokens[0].charAt(0).toUpperCase() + tokens[0].slice(1).toLowerCase();
      formattedName = single;
      initials = single.substring(0, 2).toUpperCase();
    } else {
      formattedName = 'Employee';
      initials = 'EM';
    }

    if (formattedName.length > 22) {
      formattedName = formattedName.substring(0, 21) + '…';
    }

    if (formattedName === lastDisplayedName && initials === lastDisplayedInitials) {
      return;
    }

    lastDisplayedName = formattedName;
    lastDisplayedInitials = initials;
    badgeName.textContent = formattedName;
    badgeInitials.textContent = initials;
    triggerNameTypingAnim();
  }

  // Export so login logic can trigger it after password reset auto-fills
  window.updateBadgeName = updateBadgeNameFromEmail;

  if (emailInput) {
    emailInput.addEventListener('input', updateBadgeNameFromEmail);
    emailInput.addEventListener('change', updateBadgeNameFromEmail);
  }

  // --------------------------------------------------------------------------
  // 10. PASSWORD FOCUS -> 3D BADGE FLIP
  // --------------------------------------------------------------------------
  function isPasswordGroupFocused() {
    const active = document.activeElement;
    return active === passwordInput || active === togglePasswordBtn;
  }

  function syncBadgeFlipState() {
    if (!badgeCard) return;

    const shouldFlip = isPasswordGroupFocused();
    const currentlyFlipped = badgeCard.classList.contains('is-flipped');

    if (shouldFlip && !currentlyFlipped) {
      badgeCard.classList.add('is-flipped');
      if (!prefersReducedMotion.matches) {
        velocity += SWING_SIGN * -14.0;
        startPhysicsLoop();
      }
    } else if (!shouldFlip && currentlyFlipped) {
      badgeCard.classList.remove('is-flipped');
      if (!prefersReducedMotion.matches) {
        velocity -= SWING_SIGN * -14.0;
        startPhysicsLoop();
      }
    }
  }

  document.addEventListener('focusin', syncBadgeFlipState);
  document.addEventListener('focusout', () => {
    setTimeout(syncBadgeFlipState, 40);
  });

  if (togglePasswordBtn) {
    togglePasswordBtn.addEventListener('mousedown', (e) => {
      // Prevent focusout on passwordInput so badge stays flipped on click
      e.preventDefault();
    });

    togglePasswordBtn.addEventListener('click', () => {
      if (badgeCard && !badgeCard.classList.contains('is-flipped')) {
        badgeCard.classList.add('is-flipped');
        if (!prefersReducedMotion.matches) {
          velocity += SWING_SIGN * -14.0;
          startPhysicsLoop();
        }
      }
      if (passwordInput && document.activeElement !== passwordInput) {
        passwordInput.focus();
      }
      setTimeout(syncPadlockState, 10);
    });
  }

  // --------------------------------------------------------------------------
  // 11. PADLOCK UNLATCH ANIMATION (WHEN PASSWORD SHOWN / HIDDEN)
  // --------------------------------------------------------------------------
  let isCurrentlyUnlatched = false;

  function syncPadlockState() {
    if (!passwordInput || !badgeCard) return;
    const isText = (passwordInput.type === 'text');

    if (isText && !isCurrentlyUnlatched) {
      isCurrentlyUnlatched = true;
      badgeCard.classList.add('is-unlatched');
      if (padlockBody) padlockBody.classList.remove('is-snapping');
    } else if (!isText && isCurrentlyUnlatched) {
      isCurrentlyUnlatched = false;
      badgeCard.classList.remove('is-unlatched');
      if (padlockBody && !prefersReducedMotion.matches) {
        padlockBody.classList.remove('is-snapping');
        void padlockBody.offsetWidth;
        padlockBody.classList.add('is-snapping');
      }
    }
  }

  // Export so login logic can trigger it directly
  window.syncPadlockState = syncPadlockState;

  // React to password type attribute changes
  if (passwordInput && window.MutationObserver) {
    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.type === 'attributes' && m.attributeName === 'type') {
          syncPadlockState();
        }
      }
    });
    observer.observe(passwordInput, { attributes: true, attributeFilter: ['type'] });
  }

  // --------------------------------------------------------------------------
  // 12. ERROR SHAKE & RED GLOW REACTION
  // --------------------------------------------------------------------------
  let errorKickSign = 1;
  let errorGlowTimer = null;

  function triggerBadgeErrorShake() {
    velocity = SWING_SIGN * errorKickSign * 26.0;
    errorKickSign = -errorKickSign;
    startPhysicsLoop();

    if (badgeCard) {
      badgeCard.classList.remove('is-error-kick');
      void badgeCard.offsetWidth;
      badgeCard.classList.add('is-error-kick');

      clearTimeout(errorGlowTimer);
      errorGlowTimer = setTimeout(() => {
        badgeCard.classList.remove('is-error-kick');
      }, 620);
    }
  }

  // Export so login logic can trigger it when validation fails
  window.triggerBadgeError = triggerBadgeErrorShake;

  function setupErrorObserver(errorEl) {
    if (!errorEl || !window.MutationObserver) return;
    const obs = new MutationObserver(() => {
      const isVisible = errorEl.style.display !== 'none' && errorEl.textContent.trim().length > 0;
      if (isVisible) {
        triggerBadgeErrorShake();
      }
    });
    obs.observe(errorEl, { attributes: true, attributeFilter: ['style', 'class'], childList: true });
  }
  setupErrorObserver(emailError);
  setupErrorObserver(passwordError);

  // --------------------------------------------------------------------------
  // 13. PENDING LOADING SWEEP ANIMATION
  // --------------------------------------------------------------------------
  function syncPendingState() {
    if (!loginSubmitBtn || !badgeCard) return;
    const isBusy = loginSubmitBtn.disabled ||
      loginSubmitBtn.getAttribute('aria-busy') === 'true' ||
      (loginForm && loginForm.classList.contains('is-submitting'));

    if (isBusy) {
      badgeCard.classList.add('is-pending');
    } else {
      badgeCard.classList.remove('is-pending');
    }
  }

  if (loginSubmitBtn && window.MutationObserver) {
    const btnObserver = new MutationObserver(syncPendingState);
    btnObserver.observe(loginSubmitBtn, { attributes: true, attributeFilter: ['disabled', 'aria-busy', 'class'] });
  }

  // --------------------------------------------------------------------------
  // 14. LIFECYCLE & INITIALIZATION
  // --------------------------------------------------------------------------
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      if (isLoopActive) {
        cancelAnimationFrame(rafId);
        isLoopActive = false;
      }
    } else {
      updateCachedMetrics();
      startPhysicsLoop();
    }
  });

  function initAnimations() {
    updateCachedMetrics();
    updateBadgeNameFromEmail();
    syncBadgeFlipState();
    syncPadlockState();
    syncPendingState();
    triggerDropIn();
  }

  window.addEventListener('pageshow', initAnimations);
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAnimations);
  } else {
    initAnimations();
  }

})();
