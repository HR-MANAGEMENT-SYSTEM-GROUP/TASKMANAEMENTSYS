/**
 * ============================================================================
 * MASAR HR — "INSIDE THE TEAM" CINEMATIC MEETING ROOM JOURNEY
 * ============================================================================
 * The visitor is the camera. The team is the story.
 * - 6 Team members:
 *   1. Nada Alawneh (Scrum Master & Full Stack Developer)
 *   2. Omar Smadi (Product Owner & Virtual Collaboration)
 *   3. Amneh Hazaimeh (Employee - Leave Management)
 *   4. Yaqeen Malkawi (Employee - Policies & Feedback)
 *   5. Tareq Bataineh (Employee - Task Management & Kanban)
 *   6. Gaith Amourah (Employee - Authentication & Profile Management)
 * - Pinned 2D Canvas Meeting Room with executive conference interior
 * - Master GSAP ScrollTrigger timeline with smooth camera flight
 * - Clean theme synchronization (Light & Dark)
 * - Smart anti-overlap minimap positioning
 * - Complete authentication state handling in navbar
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.TeamMeetingJourney = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // Lifecycle State
  let isMounted = false;
  let isDestroyed = false;
  let rafId = null;
  let masterTimeline = null;
  let scrollTriggerInstance = null;
  let resizeDebounceTimer = null;
  let lastFrameTime = 0;
  let idleTime = 0;

  // DOM Elements
  let containerEl = null;
  let stageEl = null;
  let canvasEl = null;
  let ctx = null;
  let scrimEl = null;
  let minimapSvgEl = null;
  let minimapCamEl = null;
  let minimapCardEl = null;
  let mobileSegments = [];
  let mobileCounterEl = null;
  let ariaAnnouncerEl = null;
  let scrollHintEl = null;

  // Viewport & Motion State
  let viewportWidth = 0;
  let viewportHeight = 0;
  let isMobile = false;
  let prefersReducedMotion = false;
  let pointerParallax = { x: 0, y: 0, targetX: 0, targetY: 0 };

  // Camera State (Driven by GSAP ScrollTrigger)
  const camera = {
    x: 0,
    y: -20,
    viewSize: 1050,
    anchorX: 0.5,
    anchor: 'center'
  };

  // Scrubbed Scene Effects State
  const effects = {
    scrumStepProgress: 0,
    scrumStep: 0,
    meetingProgress: 0,
    meetingStep: 0,
    meetingLiveColor: 0,
    leaveStepProgress: 0,
    leaveStep: 0,
    leaveDecisionAlpha: 0,
    policiesDocProgress: 0,
    policiesStep: 0,
    taskStepProgress: 0,
    taskStep: 0,
    taskCompleteColor: 0,
    authStepProgress: 0,
    authStep: 0,
    teamConnectionsProgress: 0
  };

  // ==========================================================================
  // MEETING ROOM ENTITIES: THE 6 TEAM MEMBERS & DESK STATIONS
  // Positions in World Units relative to Table Center (0, 0)
  // Table size: 560 x 250
  // ==========================================================================
  const teamMembers = [
    {
      id: 'nada',
      seatIndex: 0,
      name: 'Nada Alawneh',
      role: 'Scrum Master & Full Stack',
      dept: 'HR Platform & Agile Delivery',
      badgeId: '#SM-1001',
      x: 100,
      y: -155,
      facing: 'south',
      color: '#0f172a', // Sleek slate blazer
      hairColor: '#3b2d1f',
      accentColor: '#0079F1',
      initials: 'NA',
      laptopScreen: 'scrum_velocity',
      sceneIdx: 1
    },
    {
      id: 'omar',
      seatIndex: 1,
      name: 'Omar Smadi',
      role: 'Product Owner & Meetings Lead',
      dept: 'Product & Video Collaboration',
      badgeId: '#PO-1002',
      x: -100,
      y: -155,
      facing: 'south',
      color: '#1e3a8a', // Deep royal navy
      hairColor: '#0f172a',
      accentColor: '#2563eb',
      initials: 'OS',
      laptopScreen: 'meetings_zoom',
      sceneIdx: 2
    },
    {
      id: 'amneh',
      seatIndex: 2,
      name: 'Amneh Hazaimeh',
      role: 'Full Stack Developer',
      dept: 'Leave Management',
      badgeId: '#EMP-2041',
      x: 230,
      y: -65,
      facing: 'west',
      color: '#065f46', // Emerald blazer
      hairColor: '#1c1917',
      accentColor: '#10b981',
      initials: 'AH',
      laptopScreen: 'leave_cal',
      sceneIdx: 3
    },
    {
      id: 'yaqeen',
      seatIndex: 3,
      name: 'Yaqeen Malkawi',
      role: 'Full Stack Developer',
      dept: 'Policies & Feedback',
      badgeId: '#EMP-2042',
      x: 230,
      y: 65,
      facing: 'west',
      color: '#92400e', // Warm bronze/amber
      hairColor: '#292524',
      accentColor: '#f59e0b',
      initials: 'YM',
      laptopScreen: 'policies_doc',
      sceneIdx: 4
    },
    {
      id: 'tareq',
      seatIndex: 4,
      name: 'Tareq Bataineh',
      role: 'Full Stack Developer',
      dept: 'Task Management & Kanban',
      badgeId: '#EMP-2043',
      x: -230,
      y: 65,
      facing: 'east',
      color: '#0284c7', // Sky cyan
      hairColor: '#1e293b',
      accentColor: '#0284c7',
      initials: 'TB',
      laptopScreen: 'tasks_kanban',
      sceneIdx: 5
    },
    {
      id: 'gaith',
      seatIndex: 5,
      name: 'Gaith Amourah',
      role: 'Full Stack Developer',
      dept: 'Authentication & Profiles',
      badgeId: '#EMP-2044',
      x: -230,
      y: -65,
      facing: 'east',
      color: '#4338ca', // Indigo
      hairColor: '#0f172a',
      accentColor: '#6366f1',
      initials: 'GA',
      laptopScreen: 'auth_profile',
      sceneIdx: 6
    }
  ];

  // Wall Presentation Display (North Wall)
  const wallDisplay = {
    x: 0,
    y: -330,
    width: 280,
    height: 120
  };

  // ==========================================================================
  // SCENE CONFIGURATION ARRAY (8 STAGES: NADA FIRST, THEN OMAR)
  // ==========================================================================
  const SCENES = [
    {
      id: 0,
      label: 'About Masar',
      kicker: '01 / 08',
      level: 'Organization',
      target: { x: 0, y: -20 },
      viewSize: 1050,
      anchorX: 0.5,
      anchor: 'center',
      hudId: 'team-scene-0'
    },
    {
      id: 1,
      label: 'Scrum Master',
      kicker: '02 / 08',
      level: 'Sprint Delivery & Architecture',
      target: { x: 100, y: -155 },
      viewSize: 420,
      anchorX: 0.68,
      anchor: 'left',
      hudId: 'team-scene-1'
    },
    {
      id: 2,
      label: 'Product Owner',
      kicker: '03 / 08',
      level: 'Product Leadership & Zoom Meetings',
      target: { x: -100, y: -155 },
      viewSize: 420,
      anchorX: 0.32,
      anchor: 'right',
      hudId: 'team-scene-2'
    },
    {
      id: 3,
      label: 'Leave Systems',
      kicker: '04 / 08',
      level: 'Workforce Operations',
      target: { x: 230, y: -65 },
      viewSize: 410,
      anchorX: 0.65,
      anchor: 'left',
      hudId: 'team-scene-3'
    },
    {
      id: 4,
      label: 'Policies & Feedback',
      kicker: '05 / 08',
      level: 'Workplace Governance & Voice',
      target: { x: 230, y: 65 },
      viewSize: 410,
      anchorX: 0.65,
      anchor: 'left',
      hudId: 'team-scene-4'
    },
    {
      id: 5,
      label: 'Task Management',
      kicker: '06 / 08',
      level: 'Kanban Task Board',
      target: { x: -230, y: 65 },
      viewSize: 410,
      anchorX: 0.35,
      anchor: 'right',
      hudId: 'team-scene-5'
    },
    {
      id: 6,
      label: 'Identity & Profiles',
      kicker: '07 / 08',
      level: 'Authentication & Staff Profiles',
      target: { x: -230, y: -65 },
      viewSize: 410,
      anchorX: 0.35,
      anchor: 'right',
      hudId: 'team-scene-6'
    },
    {
      id: 7,
      label: 'The Whole Team',
      kicker: '08 / 08',
      level: 'Connected Platform',
      target: { x: 0, y: -15 },
      viewSize: 980,
      anchorX: 0.5,
      anchor: 'center',
      hudId: 'team-scene-7'
    }
  ];

  // Natural cinematic camera waypoints around the meeting table
  const TRANSITION_WAYPOINTS = [
    // 0 -> 1: Overview to Nada (Glide forward and right toward head of table)
    { midX: 50, midY: -90, peakVS: 720, midAnchorX: 0.42 },
    // 1 -> 2: Nada to Omar (Glide smoothly across head of table westwards)
    { midX: 0, midY: -160, peakVS: 490, midAnchorX: 0.50 },
    // 2 -> 3: Omar to Amneh (Curves around across table down East aisle)
    { midX: 80, midY: -110, peakVS: 680, midAnchorX: 0.55 },
    // 3 -> 4: Amneh to Yaqeen (Glides south down East aisle past desks)
    { midX: 250, midY: 0, peakVS: 560, midAnchorX: 0.65 },
    // 4 -> 5: Yaqeen to Tareq (Sweeps across South end of table towards West aisle)
    { midX: 0, midY: 140, peakVS: 740, midAnchorX: 0.50 },
    // 5 -> 6: Tareq to Gaith (Glides north up West aisle past desks)
    { midX: -250, midY: 0, peakVS: 560, midAnchorX: 0.35 },
    // 6 -> 7: Gaith to Connected Team (Pulls back into wide panoramic view)
    { midX: -100, midY: -50, peakVS: 800, midAnchorX: 0.50 }
  ];

  // Steam particles simulation for coffee mugs
  const steamParticles = [];
  for (let i = 0; i < 24; i++) {
    steamParticles.push({
      seatIdx: i % teamMembers.length,
      x: 0,
      y: 0,
      progress: i / 24,
      speed: 0.18 + (i % 3) * 0.05
    });
  }

  // ==========================================================================
  // GSAP TIMELINE & SCROLLTRIGGER SETUP
  // ==========================================================================
  function setupTimeline() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
      console.warn('GSAP or ScrollTrigger not loaded. Using fallback display.');
      activateFallbackMode();
      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    const spacer = document.getElementById('teamScrollSpacer');
    if (!spacer) return;

    if (scrollTriggerInstance) scrollTriggerInstance.kill();
    if (masterTimeline) masterTimeline.kill();

    masterTimeline = gsap.timeline({
      paused: true,
      defaults: { ease: 'power2.inOut' }
    });

    const totalScenes = SCENES.length;
    const slotDuration = 100;

    // Reset initial camera
    camera.x = SCENES[0].target.x;
    camera.y = SCENES[0].target.y;
    camera.viewSize = SCENES[0].viewSize;
    camera.anchorX = SCENES[0].anchorX;
    camera.anchor = SCENES[0].anchor;

    SCENES.forEach((scene, i) => {
      const startTime = i * slotDuration;
      const nextScene = SCENES[i + 1] || null;
      // Dwell: 58% of scene scroll; Travel: 42% for room flight
      const dwellDuration = slotDuration * 0.58;
      const travelDuration = slotDuration * 0.42;

      // 1. Dwell Phase: Camera holds still, scene features animate
      if (i === 1) {
        // Scene 1: Nada Alawneh (Scrum Master) - Agile delivery stepper
        masterTimeline.fromTo(
          effects,
          { scrumStepProgress: 0 },
          {
            scrumStepProgress: 3.99,
            duration: dwellDuration,
            ease: 'none',
            onUpdate: function () {
              const step = Math.min(3, Math.floor(effects.scrumStepProgress));
              effects.scrumStep = step;
              updateStepperHUD('scrumStepper', step);
            }
          },
          startTime
        );
      } else if (i === 2) {
        // Scene 2: Omar Smadi (Product Owner) - Zoom meeting coordination stepper
        masterTimeline.fromTo(
          effects,
          { meetingProgress: 0 },
          {
            meetingProgress: 3.99,
            duration: dwellDuration,
            ease: 'none',
            onUpdate: function () {
              const step = Math.min(3, Math.floor(effects.meetingProgress));
              effects.meetingStep = step;
              effects.meetingLiveColor = step === 3 ? 1 : 0;
              updateStepperHUD('meetingStepper', step);
            }
          },
          startTime
        );
      } else if (i === 3) {
        // Scene 3: Amneh Hazaimeh (Leave) - Leave lifecycle stepper
        masterTimeline.fromTo(
          effects,
          { leaveStepProgress: 0 },
          {
            leaveStepProgress: 3.99,
            duration: dwellDuration,
            ease: 'none',
            onUpdate: function () {
              const step = Math.min(3, Math.floor(effects.leaveStepProgress));
              effects.leaveStep = step;
              effects.leaveDecisionAlpha = step >= 2 ? 1 : 0;
              updateStepperHUD('leaveStepper', step);
            }
          },
          startTime
        );
      } else if (i === 4) {
        // Scene 4: Yaqeen Malkawi (Policies & Feedback) - Governance & Feedback stepper
        masterTimeline.fromTo(
          effects,
          { policiesDocProgress: 0 },
          {
            policiesDocProgress: 3.99,
            duration: dwellDuration,
            ease: 'none',
            onUpdate: function () {
              const step = Math.min(3, Math.floor(effects.policiesDocProgress));
              effects.policiesStep = step;
              updateStepperHUD('policiesStepper', step);
            }
          },
          startTime
        );
      } else if (i === 5) {
        // Scene 5: Tareq Bataineh (Task Management) - Kanban task stepper
        masterTimeline.fromTo(
          effects,
          { taskStepProgress: 0 },
          {
            taskStepProgress: 3.99,
            duration: dwellDuration,
            ease: 'none',
            onUpdate: function () {
              const step = Math.min(3, Math.floor(effects.taskStepProgress));
              effects.taskStep = step;
              effects.taskCompleteColor = step === 3 ? 1 : 0;
              updateStepperHUD('taskStepper', step);
            }
          },
          startTime
        );
      } else if (i === 6) {
        // Scene 6: Gaith Amourah (Authentication & Profile) - Identity & Session stepper
        masterTimeline.fromTo(
          effects,
          { authStepProgress: 0 },
          {
            authStepProgress: 3.99,
            duration: dwellDuration,
            ease: 'none',
            onUpdate: function () {
              const step = Math.min(3, Math.floor(effects.authStepProgress));
              effects.authStep = step;
              updateStepperHUD('authStepper', step);
            }
          },
          startTime
        );
      } else if (i === 7) {
        // Scene 7: Whole Connected Team
        masterTimeline.fromTo(
          effects,
          { teamConnectionsProgress: 0 },
          {
            teamConnectionsProgress: 1,
            duration: dwellDuration,
            ease: 'power1.out'
          },
          startTime
        );
      }

      // 2. Travel Phase: Camera smoothly glides to next scene
      if (nextScene) {
        const wp = TRANSITION_WAYPOINTS[i] || {
          midX: (scene.target.x + nextScene.target.x) / 2,
          midY: (scene.target.y + nextScene.target.y) / 2,
          peakVS: Math.max(scene.viewSize, nextScene.viewSize) * 1.15,
          midAnchorX: 0.5
        };

        const travelStart = startTime + dwellDuration;
        const halfTravel = travelDuration / 2;

        // Sub-phase A: Arc out to midpoint
        masterTimeline.to(
          camera,
          {
            x: wp.midX,
            y: wp.midY,
            viewSize: wp.peakVS,
            anchorX: wp.midAnchorX !== undefined ? wp.midAnchorX : 0.5,
            duration: halfTravel,
            ease: 'power2.in'
          },
          travelStart
        );

        // Sub-phase B: Descend into next target
        masterTimeline.to(
          camera,
          {
            x: nextScene.target.x,
            y: nextScene.target.y,
            viewSize: nextScene.viewSize,
            anchorX: nextScene.anchorX !== undefined ? nextScene.anchorX : 0.5,
            anchor: nextScene.anchor,
            duration: halfTravel,
            ease: 'power2.out'
          },
          travelStart + halfTravel
        );
      }
    });

    // Bind Master Timeline to ScrollTrigger with smooth scrub
    scrollTriggerInstance = ScrollTrigger.create({
      animation: masterTimeline,
      trigger: spacer,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 0.8,
      snap: prefersReducedMotion
        ? false
        : {
            snapTo: function (progress) {
              const total = totalScenes - 1;
              const currentPos = progress * total;
              const slot = Math.floor(currentPos);
              const frac = currentPos - slot;

              // Autoscroll to next scene once scrolled ~78%
              if (frac >= 0.78) {
                return Math.min(1, (slot + 1) / total);
              }
              // If scrolled backwards and within ~22%
              if (frac <= 0.22) {
                return Math.max(0, slot / total);
              }

              // In between: free manual scroll
              return progress;
            },
            duration: { min: 0.15, max: 0.35 },
            delay: 0.04,
            ease: 'power1.out'
          },
      onUpdate: function (self) {
        if (!isMounted) return;
        const progress = self.progress;
        const exactScene = progress * (totalScenes - 1);
        const currentSlot = Math.floor(exactScene);
        const frac = exactScene - currentSlot;
        const activeSceneIndex = frac < 0.78 ? currentSlot : Math.min(totalScenes - 1, currentSlot + 1);

        updateHUDVisibilities(exactScene, activeSceneIndex);
        updateChromeIndicators(activeSceneIndex, progress);
      }
    });

    // Initial state
    masterTimeline.progress(0);
    updateHUDVisibilities(0, 0);
    updateChromeIndicators(0, 0);
  }

  // ==========================================================================
  // HUD & CHROME SYNCHRONIZATION (WITH ANTI-OVERLAP MINIMAP)
  // ==========================================================================
  function updateHUDVisibilities(exactScene, activeIndex) {
    if (scrollHintEl) {
      scrollHintEl.style.opacity = exactScene > 0.08 ? '0' : '1';
    }

    const currentSlot = Math.floor(exactScene);
    const frac = exactScene - currentSlot;

    // Scrim lighting adapts to travel
    const activeSceneConfig = SCENES[activeIndex];
    if (scrimEl && activeSceneConfig) {
      scrimEl.className = 'team-scrim scrim-' + activeSceneConfig.anchor;
      if (frac >= 0.65 && frac <= 0.78 && currentSlot < SCENES.length - 1) {
        scrimEl.style.opacity = '0.35';
      } else {
        scrimEl.style.opacity = '1';
      }
    }

    // Individual HUD Cards: Dwell -> Departure -> Arrival
    SCENES.forEach((scene, idx) => {
      const el = document.getElementById(scene.hudId);
      if (!el) return;

      let opacity = 0;
      let translateY = 0;

      if (idx === currentSlot) {
        if (frac <= 0.58) {
          // Dwell: 100% visible and interactive
          opacity = 1;
          translateY = 0;
        } else if (frac <= 0.72) {
          // Departure: old HUD gently slides upward and dissolves
          const p = (frac - 0.58) / (0.72 - 0.58);
          opacity = 1 - p;
          translateY = -24 * p;
        } else {
          opacity = 0;
          translateY = -24;
        }
      } else if (idx === currentSlot + 1 && frac > 0.72) {
        // Arrival: incoming HUD slides into position
        const p = (frac - 0.72) / (1 - 0.72);
        opacity = p;
        translateY = 24 * (1 - p);
      } else {
        opacity = 0;
        translateY = 24;
      }

      if (opacity > 0.01) {
        el.classList.add('is-active');
        el.style.opacity = opacity.toFixed(3);
        const baseTrans = isMobile
          ? `translateY(${translateY.toFixed(1)}px)`
          : scene.anchor === 'center'
          ? `translate(-50%, -50%) translateY(${translateY.toFixed(1)}px)`
          : `translateY(-50%) translateY(${translateY.toFixed(1)}px)`;
        el.style.transform = baseTrans;
      } else {
        el.classList.remove('is-active');
        el.style.opacity = '0';
      }
    });
  }

  function updateChromeIndicators(activeIdx, progress) {
    const scene = SCENES[activeIdx];
    if (!scene) return;

    if (mobileCounterEl) {
      mobileCounterEl.textContent = scene.kicker;
    }
    mobileSegments.forEach((seg, idx) => {
      if (idx === activeIdx) {
        seg.className = 'team-mobile-seg is-active';
      } else if (idx < activeIdx) {
        seg.className = 'team-mobile-seg is-done';
      } else {
        seg.className = 'team-mobile-seg';
      }
    });

    // Smart Anti-Overlap Minimap Positioning:
    // If the active card is on the right, dock minimap on bottom-left.
    // If the active card is on the left or center, dock minimap on bottom-right.
    if (minimapCardEl) {
      if (scene.anchor === 'right') {
        minimapCardEl.classList.add('dock-left');
      } else {
        minimapCardEl.classList.remove('dock-left');
      }
    }

    // Minimap indicator coordinates
    if (minimapCamEl && !isMobile) {
      const mmX = Math.max(18, Math.min(122, 70 + (camera.x / 230) * 42));
      const mmY = Math.max(14, Math.min(76, 45 + (camera.y / 155) * 24));
      minimapCamEl.setAttribute('cx', mmX.toFixed(1));
      minimapCamEl.setAttribute('cy', mmY.toFixed(1));

      // Highlight active chair
      document.querySelectorAll('.mm-chair').forEach((chair) => {
        const chairSeat = parseInt(chair.dataset.seat, 10);
        const isCurrent = activeIdx > 0 && activeIdx <= 6 && (activeIdx - 1) === chairSeat;
        chair.classList.toggle('is-active', isCurrent);
      });
    }

    if (ariaAnnouncerEl && ariaAnnouncerEl.dataset.currentScene !== activeIdx.toString()) {
      ariaAnnouncerEl.dataset.currentScene = activeIdx.toString();
      ariaAnnouncerEl.textContent = `Meeting Scene ${activeIdx + 1} of 8: ${scene.label}. Focused on ${scene.level}.`;
    }
  }

  function updateStepperHUD(stepperId, activeStep) {
    const steps = document.querySelectorAll(`#${stepperId} .team-step`);
    steps.forEach((el, idx) => {
      if (idx === activeStep) {
        el.classList.add('is-active');
        el.classList.remove('is-completed');
      } else if (idx < activeStep) {
        el.classList.add('is-completed');
        el.classList.remove('is-active');
      } else {
        el.classList.remove('is-active', 'is-completed');
      }
    });
  }

  // ==========================================================================
  // CANVAS 2D MEETING ROOM RENDER ENGINE
  // ==========================================================================
  function render(now) {
    if (!isMounted || isDestroyed) return;

    const delta = Math.min(0.05, Math.max(0.001, (now - lastFrameTime) / 1000));
    lastFrameTime = now;
    idleTime += delta;

    // Smooth cursor parallax interpolation
    pointerParallax.x += (pointerParallax.targetX - pointerParallax.x) * 0.08;
    pointerParallax.y += (pointerParallax.targetY - pointerParallax.y) * 0.08;

    // Clear Canvas
    ctx.clearRect(0, 0, viewportWidth, viewportHeight);

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

    // Projection Scale
    const shorterSide = Math.min(viewportWidth, viewportHeight);
    const scale = shorterSide / Math.max(100, camera.viewSize);

    // Screen Anchor Placement
    const focusScreenX = viewportWidth * (isMobile ? 0.5 : (camera.anchorX !== undefined ? camera.anchorX : 0.5));
    const focusScreenY = viewportHeight * (isMobile ? 0.32 : 0.5);

    function w2s(wx, wy, depth = 1.0) {
      const camX = camera.x * depth;
      const camY = camera.y * depth;
      const sx = focusScreenX + (wx - camX + pointerParallax.x * depth) * scale;
      const sy = focusScreenY + (wy - camY + pointerParallax.y * depth) * scale;
      return { x: sx, y: sy };
    }

    const origin = w2s(0, 0);

    // ------------------------------------------------------------------------
    // 1. FLOOR & ARCHITECTURAL GRID
    // ------------------------------------------------------------------------
    ctx.save();
    ctx.fillStyle = isDark ? '#0e1626' : '#f8fafc';
    ctx.fillRect(0, 0, viewportWidth, viewportHeight);

    // Grid lines
    ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(226, 232, 240, 0.7)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let gx = -600; gx <= 600; gx += 120) {
      const pTop = w2s(gx, -450, 0.95);
      const pBot = w2s(gx, 450, 0.95);
      ctx.moveTo(pTop.x, pTop.y);
      ctx.lineTo(pBot.x, pBot.y);
    }
    for (let gy = -400; gy <= 400; gy += 100) {
      const pL = w2s(-650, gy, 0.95);
      const pR = w2s(650, gy, 0.95);
      ctx.moveTo(pL.x, pL.y);
      ctx.lineTo(pR.x, pR.y);
    }
    ctx.stroke();

    // Soft overhead light wash under table
    const tableShadow = ctx.createRadialGradient(origin.x, origin.y, 40 * scale, origin.x, origin.y, 340 * scale);
    tableShadow.addColorStop(0, isDark ? 'rgba(0, 0, 0, 0.5)' : 'rgba(15, 23, 42, 0.12)');
    tableShadow.addColorStop(0.7, isDark ? 'rgba(0, 0, 0, 0.2)' : 'rgba(15, 23, 42, 0.04)');
    tableShadow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = tableShadow;
    ctx.fillRect(origin.x - 360 * scale, origin.y - 220 * scale, 720 * scale, 440 * scale);
    ctx.restore();

    // ------------------------------------------------------------------------
    // 2. NORTH WALL SCREEN (MASAR BRAND HUB)
    // ------------------------------------------------------------------------
    const pWall = w2s(wallDisplay.x, wallDisplay.y);
    const sw = wallDisplay.width * scale;
    const sh = wallDisplay.height * scale;

    ctx.save();
    ctx.fillStyle = isDark ? '#172033' : '#0f172a';
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(pWall.x - sw / 2, pWall.y - sh / 2, sw, sh, 8 * scale);
    } else {
      ctx.rect(pWall.x - sw / 2, pWall.y - sh / 2, sw, sh);
    }
    ctx.fill();

    // Screen Glass
    ctx.fillStyle = isDark ? '#1e293b' : '#172033';
    ctx.fillRect(pWall.x - sw / 2 + 3 * scale, pWall.y - sh / 2 + 3 * scale, sw - 6 * scale, sh - 6 * scale);

    // Screen Brand Header
    if (camera.viewSize < 900) {
      ctx.fillStyle = '#0079F1';
      ctx.font = `700 ${Math.max(8, 10 * scale)}px Quicksand, system-ui`;
      ctx.textAlign = 'center';
      ctx.fillText('MASAR • UNIFIED HR PLATFORM', pWall.x, pWall.y - 12 * scale);

      ctx.fillStyle = isDark ? '#94a3b8' : '#cbd5e1';
      ctx.font = `500 ${Math.max(6, 7.5 * scale)}px Inter, system-ui`;
      ctx.fillText('Sprint Velocity • Leave Quotas • Policies • Meetings • Feedback', pWall.x, pWall.y + 10 * scale);
    }
    ctx.restore();

    // ------------------------------------------------------------------------
    // 3. EXECUTIVE CONFERENCE TABLE
    // ------------------------------------------------------------------------
    const tWidth = 560 * scale;
    const tHeight = 250 * scale;
    const tRadius = 115 * scale;

    ctx.save();
    ctx.shadowColor = isDark ? 'rgba(0, 0, 0, 0.6)' : 'rgba(15, 23, 42, 0.15)';
    ctx.shadowBlur = 26 * scale;
    ctx.shadowOffsetY = 10 * scale;

    // Table Surface
    const tableGrad = ctx.createLinearGradient(origin.x, origin.y - tHeight / 2, origin.x, origin.y + tHeight / 2);
    if (isDark) {
      tableGrad.addColorStop(0, '#1c2740');
      tableGrad.addColorStop(0.5, '#152238');
      tableGrad.addColorStop(1, '#0e1626');
    } else {
      tableGrad.addColorStop(0, '#ffffff');
      tableGrad.addColorStop(0.5, '#f8fafc');
      tableGrad.addColorStop(1, '#f1f5f9');
    }
    ctx.fillStyle = tableGrad;

    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(origin.x - tWidth / 2, origin.y - tHeight / 2, tWidth, tHeight, tRadius);
    } else {
      ctx.rect(origin.x - tWidth / 2, origin.y - tHeight / 2, tWidth, tHeight);
    }
    ctx.fill();

    // Beveled Perimeter Border
    ctx.shadowColor = 'transparent';
    ctx.lineWidth = Math.max(1, 2 * scale);
    ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.12)' : '#e2e8f0';
    ctx.stroke();

    // Center Cable & Frosted Inlay
    ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(241, 245, 249, 0.85)';
    ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(203, 213, 225, 0.7)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(origin.x - (tWidth - 80 * scale) / 2, origin.y - 12 * scale, tWidth - 80 * scale, 24 * scale, 8 * scale);
    } else {
      ctx.rect(origin.x - (tWidth - 80 * scale) / 2, origin.y - 12 * scale, tWidth - 80 * scale, 24 * scale);
    }
    ctx.fill();
    ctx.stroke();

    // Center Power Ports
    ctx.fillStyle = isDark ? '#475569' : '#cbd5e1';
    for (let p = -2; p <= 2; p++) {
      ctx.beginPath();
      ctx.arc(origin.x + p * 50 * scale, origin.y, 3 * scale, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // ------------------------------------------------------------------------
    // 4. SCENE 7 CONNECTED OPERATIONAL CONDUITS
    // ------------------------------------------------------------------------
    if (effects.teamConnectionsProgress > 0) {
      ctx.save();
      ctx.lineWidth = 2.2 * scale;
      ctx.setLineDash([7 * scale, 7 * scale]);
      ctx.lineDashOffset = -idleTime * 28 * scale;
      ctx.strokeStyle = `rgba(0, 121, 241, ${effects.teamConnectionsProgress * 0.8})`;

      // Connect all members in an interconnected network loop
      for (let i = 0; i < teamMembers.length; i++) {
        const p1 = w2s(teamMembers[i].x, teamMembers[i].y);
        const nextIdx = (i + 1) % teamMembers.length;
        const p2 = w2s(teamMembers[nextIdx].x, teamMembers[nextIdx].y);

        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.bezierCurveTo(origin.x, origin.y, origin.x, origin.y, p2.x, p2.y);
        ctx.stroke();
      }
      ctx.restore();
    }

    // ------------------------------------------------------------------------
    // 5. DESK PADS, LAPTOPS & COFFEE MUGS
    // ------------------------------------------------------------------------
    teamMembers.forEach((m) => {
      const p = w2s(m.x, m.y);
      ctx.save();

      // Leather Desk Blotter Pad
      ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.05)' : '#f1f5f9';
      ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.1)' : '#e2e8f0';
      ctx.lineWidth = 1;
      const padW = 75 * scale;
      const padH = 45 * scale;
      const padOffY = m.facing === 'south' ? 30 * scale : m.facing === 'north' ? -30 * scale : 0;
      const padOffX = m.facing === 'east' ? 30 * scale : m.facing === 'west' ? -30 * scale : 0;

      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(p.x + padOffX - padW / 2, p.y + padOffY - padH / 2, padW, padH, 6 * scale);
      } else {
        ctx.rect(p.x + padOffX - padW / 2, p.y + padOffY - padH / 2, padW, padH);
      }
      ctx.fill();
      ctx.stroke();

      // Sleek Laptop
      const lapW = 48 * scale;
      const lapH = 30 * scale;
      ctx.fillStyle = isDark ? '#0f172a' : '#1e293b';
      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(p.x + padOffX - lapW / 2, p.y + padOffY - lapH / 2, lapW, lapH, 4 * scale);
      } else {
        ctx.rect(p.x + padOffX - lapW / 2, p.y + padOffY - lapH / 2, lapW, lapH);
      }
      ctx.fill();

      // Illuminated Laptop Screen
      let screenColor = isDark ? '#1e293b' : '#334155';
      if (m.id === 'nada') screenColor = '#0079F1';
      if (m.id === 'omar') screenColor = effects.meetingLiveColor ? '#0284c7' : '#2563eb';
      if (m.id === 'amneh') screenColor = effects.leaveDecisionAlpha > 0 ? '#059669' : '#10b981';
      if (m.id === 'yaqeen') screenColor = '#d97706';
      if (m.id === 'tareq') screenColor = effects.taskCompleteColor ? '#059669' : '#0284c7';
      if (m.id === 'gaith') screenColor = '#4f46e5';

      ctx.fillStyle = screenColor;
      ctx.fillRect(p.x + padOffX - lapW / 2 + 3 * scale, p.y + padOffY - lapH / 2 + 3 * scale, lapW - 6 * scale, lapH - 6 * scale);

      // Ceramic Coffee Mug
      const mugX = p.x + padOffX + (m.facing === 'west' ? -32 * scale : 32 * scale);
      const mugY = p.y + padOffY + (m.facing === 'south' ? -18 * scale : 18 * scale);
      ctx.fillStyle = isDark ? '#334155' : '#ffffff';
      ctx.strokeStyle = isDark ? '#475569' : '#cbd5e1';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(mugX, mugY, 5 * scale, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#78350f';
      ctx.beginPath();
      ctx.arc(mugX, mugY, 3.5 * scale, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    });

    // Coffee Steam Wisps
    ctx.save();
    steamParticles.forEach((sp) => {
      sp.progress += delta * sp.speed;
      if (sp.progress > 1) sp.progress = 0;
      const m = teamMembers[sp.seatIdx];
      const p = w2s(m.x, m.y);
      const padOffY = m.facing === 'south' ? 30 * scale : m.facing === 'north' ? -30 * scale : 0;
      const padOffX = m.facing === 'east' ? 30 * scale : m.facing === 'west' ? -30 * scale : 0;
      const mugX = p.x + padOffX + (m.facing === 'west' ? -32 * scale : 32 * scale);
      const mugY = p.y + padOffY + (m.facing === 'south' ? -18 * scale : 18 * scale);
      const sy = mugY - sp.progress * 18 * scale;
      const sx = mugX + Math.sin(idleTime * 3 + sp.progress * 4) * 3 * scale;
      const alpha = (1 - sp.progress) * 0.35;

      ctx.fillStyle = `rgba(148, 163, 184, ${alpha})`;
      ctx.beginPath();
      ctx.arc(sx, sy, (1.5 + sp.progress * 2) * scale, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();

    // ------------------------------------------------------------------------
    // 6. THE 6 TEAM MEMBERS (EDITORIAL AVATARS)
    // ------------------------------------------------------------------------
    teamMembers.forEach((m, mIdx) => {
      const p = w2s(m.x, m.y, 1.02);
      const distToCam = Math.hypot(m.x - camera.x, m.y - camera.y);
      const prominence = Math.max(0.72, Math.min(1.0, 1.0 - (distToCam - 120) / 480));
      const breathe = Math.sin(idleTime * 2.2 + mIdx * 1.2) * 1.5 * scale;

      ctx.save();
      ctx.globalAlpha = prominence;

      // Warm focus glow on floor under active subject
      if (prominence > 0.88) {
        const glowStrength = (prominence - 0.88) / 0.12;
        const seatHalo = ctx.createRadialGradient(p.x, p.y, 8 * scale, p.x, p.y, 65 * scale);
        seatHalo.addColorStop(0, `rgba(0, 121, 241, ${0.18 * glowStrength})`);
        seatHalo.addColorStop(1, 'rgba(0, 121, 241, 0)');
        ctx.fillStyle = seatHalo;
        ctx.fillRect(p.x - 70 * scale, p.y - 70 * scale, 140 * scale, 140 * scale);
      }

      // Chair backrest behind person
      const chairW = 44 * scale;
      const chairH = 14 * scale;
      const chairDist = 26 * scale;
      let chairX = p.x;
      let chairY = p.y;
      if (m.facing === 'south') chairY -= chairDist;
      if (m.facing === 'north') chairY += chairDist;
      if (m.facing === 'west') chairX += chairDist;
      if (m.facing === 'east') chairX -= chairDist;

      ctx.fillStyle = isDark ? '#334155' : '#475569';
      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(chairX - chairW / 2, chairY - chairH / 2, chairW, chairH, 6 * scale);
      } else {
        ctx.rect(chairX - chairW / 2, chairY - chairH / 2, chairW, chairH);
      }
      ctx.fill();

      // Body / Shoulders
      ctx.fillStyle = m.color;
      ctx.beginPath();
      const bodyW = 38 * scale;
      const bodyH = 24 * scale;
      ctx.ellipse(p.x, p.y + breathe, bodyW / 2, bodyH / 2, 0, 0, Math.PI * 2);
      ctx.fill();

      // Head
      ctx.fillStyle = isDark ? '#e2e8f0' : '#f8fafc';
      ctx.beginPath();
      ctx.arc(p.x, p.y - 12 * scale + breathe, 9 * scale, 0, Math.PI * 2);
      ctx.fill();

      // Professional Styled Hair
      ctx.fillStyle = m.hairColor;
      ctx.beginPath();
      ctx.arc(p.x, p.y - 14 * scale + breathe, 8.5 * scale, Math.PI, Math.PI * 2);
      ctx.fill();

      // Role Initials Monogram Badge on Shoulder
      ctx.fillStyle = m.accentColor;
      ctx.beginPath();
      ctx.arc(p.x + 12 * scale, p.y + 4 * scale + breathe, 5.5 * scale, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = `700 ${Math.max(6, 6 * scale)}px Quicksand, system-ui`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(m.initials, p.x + 12 * scale, p.y + 4.2 * scale + breathe);

      ctx.restore();
    });

    rafId = requestAnimationFrame(render);
  }

  // ==========================================================================
  // JUMP TO SCENE HELPER
  // ==========================================================================
  function jumpToScene(targetIdx) {
    if (targetIdx < 0 || targetIdx >= SCENES.length) return;
    const spacer = document.getElementById('teamScrollSpacer');
    if (!spacer) return;

    const totalHeight = spacer.offsetHeight - window.innerHeight;
    const targetScroll = (targetIdx / (SCENES.length - 1)) * totalHeight;

    window.scrollTo({
      top: targetScroll,
      behavior: prefersReducedMotion ? 'auto' : 'smooth'
    });
  }

  // ==========================================================================
  // FALLBACK MODE
  // ==========================================================================
  function activateFallbackMode() {
    SCENES.forEach((scene) => {
      const el = document.getElementById(scene.hudId);
      if (el) {
        el.style.position = 'relative';
        el.style.opacity = '1';
        el.style.visibility = 'visible';
        el.style.transform = 'none';
        el.style.marginBottom = '2rem';
      }
    });
    if (stageEl) {
      stageEl.style.position = 'relative';
      stageEl.style.height = 'auto';
    }
  }

  // ==========================================================================
  // VIEWPORT RESIZING
  // ==========================================================================
  function handleResize() {
    viewportWidth = window.innerWidth;
    viewportHeight = window.innerHeight;
    isMobile = viewportWidth <= 768;

    if (canvasEl) {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvasEl.width = viewportWidth * dpr;
      canvasEl.height = viewportHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    if (scrollTriggerInstance) {
      scrollTriggerInstance.refresh();
    }
  }

  // ==========================================================================
  // AUTHENTICATION & NAVBAR CONTROLLER
  // ==========================================================================
  function initAuthNavbar() {
    let currentUser = null;
    try {
      const savedUser = localStorage.getItem('currentUser');
      if (savedUser) currentUser = JSON.parse(savedUser);
    } catch (e) {
      console.error('Invalid currentUser in localStorage:', e);
      currentUser = null;
    }

    const navAuth = document.getElementById('navAuth');
    const navUser = document.getElementById('navUser');
    const userName = document.getElementById('userName');

    if (navAuth && navUser) {
      const loggedIn = currentUser && currentUser.role === 'employee';
      navAuth.classList.toggle('hidden', !!loggedIn);
      navUser.classList.toggle('hidden', !loggedIn);
      if (loggedIn && userName) {
        userName.textContent = currentUser.name || 'Employee';
      }
    }

    window.logout = function () {
      localStorage.removeItem('currentUser');
      localStorage.removeItem('userRole');
      localStorage.removeItem('bridgeway_current_role');
      window.location.href = '../../GAITH/login.html';
    };
  }

  // ==========================================================================
  // THEME SYNCHRONIZATION
  // ==========================================================================
  function initTheme() {
    const root = document.documentElement;
    const btn = document.getElementById('themeToggle');
    const lab = document.getElementById('themeLabel');

    function paint() {
      const dark = root.getAttribute('data-theme') === 'dark';
      if (btn) {
        btn.setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme');
      }
      if (lab) lab.textContent = dark ? 'Light' : 'Dark';
    }

    let savedTheme = null;
    try { savedTheme = localStorage.getItem('theme') || localStorage.getItem('journey-theme'); } catch (e) {}
    if (savedTheme === 'dark') {
      root.setAttribute('data-theme', 'dark');
    } else {
      root.removeAttribute('data-theme');
    }

    if (btn) {
      btn.addEventListener('click', function () {
        const isDark = root.getAttribute('data-theme') === 'dark';
        if (!isDark) {
          root.setAttribute('data-theme', 'dark');
          try {
            localStorage.setItem('journey-theme', 'dark');
            localStorage.setItem('theme', 'dark');
          } catch (e) {}
        } else {
          root.removeAttribute('data-theme');
          try {
            localStorage.setItem('journey-theme', 'light');
            localStorage.setItem('theme', 'light');
          } catch (e) {}
        }
        paint();
      });
    }
    paint();
  }

  // ==========================================================================
  // MOUNT & INITIALIZE
  // ==========================================================================
  function mount() {
    if (isMounted) return;
    isMounted = true;
    isDestroyed = false;

    containerEl = document.getElementById('teamJourneyMaster');
    stageEl = document.getElementById('teamStage');
    canvasEl = document.getElementById('teamCanvas');
    if (canvasEl) ctx = canvasEl.getContext('2d');
    scrimEl = document.getElementById('teamScrim');
    minimapSvgEl = document.getElementById('teamMinimapSvg');
    minimapCamEl = document.getElementById('teamMinimapCam');
    minimapCardEl = document.getElementById('teamMinimap');
    mobileCounterEl = document.getElementById('teamMobileCounter');
    mobileSegments = Array.prototype.slice.call(document.querySelectorAll('.team-mobile-seg'));
    ariaAnnouncerEl = document.getElementById('teamAnnouncer');
    scrollHintEl = document.getElementById('teamScrollHint');

    prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Pointer Parallax
    window.addEventListener('pointermove', function (e) {
      pointerParallax.targetX = ((e.clientX / window.innerWidth) - 0.5) * 45;
      pointerParallax.targetY = ((e.clientY / window.innerHeight) - 0.5) * 35;
    }, { passive: true });

    // Keyboard navigation
    window.addEventListener('keydown', function (e) {
      const tag = document.activeElement && document.activeElement.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      const totalScenes = SCENES.length;
      const spacer = document.getElementById('teamScrollSpacer');
      if (!spacer) return;
      const totalH = spacer.offsetHeight - window.innerHeight;
      const curIdx = Math.round((window.scrollY / totalH) * (totalScenes - 1));

      if (e.key === 'ArrowDown' || e.key === 'PageDown') {
        e.preventDefault();
        jumpToScene(Math.min(totalScenes - 1, curIdx + 1));
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault();
        jumpToScene(Math.max(0, curIdx - 1));
      } else if (e.key === 'Home') {
        e.preventDefault();
        jumpToScene(0);
      } else if (e.key === 'End') {
        e.preventDefault();
        jumpToScene(totalScenes - 1);
      }
    });

    // Resize Handler
    window.addEventListener('resize', function () {
      clearTimeout(resizeDebounceTimer);
      resizeDebounceTimer = setTimeout(handleResize, 150);
    });

    initAuthNavbar();
    initTheme();
    handleResize();
    setupTimeline();

    lastFrameTime = performance.now();
    rafId = requestAnimationFrame(render);
  }

  // Public API
  return {
    mount: mount,
    jumpToScene: jumpToScene
  };
});

// Auto-boot on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () {
    if (window.TeamMeetingJourney) window.TeamMeetingJourney.mount();
  });
} else {
  if (window.TeamMeetingJourney) window.TeamMeetingJourney.mount();
}
