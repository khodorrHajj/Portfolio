import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Center, Html, OrbitControls, useGLTF } from "@react-three/drei";
import * as THREE from "three";

const MODEL_PATH = "/models/desk_pc_room.optimized.glb";
const MOBILE_SCREEN_UI_DELAY_MS = 1200;
const ROOM_TRANSITION_MS = 900;
const ROOM_CAMERA_POSITION = [0, 1.0, 5.2];
const ROOM_TARGET = [0, 0, 0];
const INTRO_CAMERA_POSITION = [0, 1.0, 10.5];
const INTRO_TARGET = [0, 1.05, 7.2];
const INTRO_POPUP_POSITION = [0, 1.05, 7.2];
const MOBILE_BREAKPOINT = 768;
const DESKTOP_FOLDERS = [
  "About Me",
  "Projects",
  "Skills",
  "Experience",
  "Education",
  "Contact",
];

const FOLDER_CONTENT = {
  "About Me": [
    {
      heading: "Khodor El Hajj Moussa",
      meta: "Computer Science Undergraduate | Full-Stack Developer Intern",
      body: (
        <>
          I am a <strong>Computer Science undergraduate</strong> at Antonine
          University, expected Jan 2027, focused on full-stack development and
          practical software projects.
        </>
      ),
    },
    {
      heading: "What I Build",
      body: "I build and deploy applications with React, Next.js, TypeScript, FastAPI, PostgreSQL, Docker, and Python, with extra project work in computer vision, developer tooling, and compiler fundamentals.",
    },
    {
      heading: "Current Focus",
      body: "I am growing toward production-level software engineering work: cleaner architecture, stronger backend systems, useful user experiences, and projects that solve real problems.",
    },
  ],
  Projects: [
    {
      heading: "LiraTrack - Lebanese Finance Tracker",
      meta: "Full-Stack Finance App | Next.js, React, TypeScript, FastAPI, PostgreSQL, Docker",
      body: "A full-stack personal finance app designed around Lebanon's mixed LBP/USD financial environment, including cash wallets, card balances, income, expenses, net worth tracking, and exchange-rate-aware reporting.",
      items: [
        "Implemented email/password login, Google sign-in, email verification, password reset, signed JWT access/refresh tokens, optional TOTP 2FA, bcrypt hashing, account deletion, restricted CORS, origin checks, and browser security headers.",
        "Built wallet tracking, categories, recurring transactions, OCR receipt scanning, SMS-based transaction draft creation, pending transaction review, Arabic/English support, and PDF report export.",
        "Structured the backend with FastAPI routers, Pydantic schemas, SQLAlchemy models, Alembic migrations, service-layer logic, and Dockerized frontend/backend/PostgreSQL development.",
      ],
      links: [
        {
          href: "https://github.com/khodorrHajj/Lebanese_Finance_Tracker",
          label: "GitHub",
        },
        {
          href: "https://lebanese-finance-tracker.vercel.app",
          label: "Live",
        },
      ],
    },
    {
      heading: "ASL-ML - Real-Time American Sign Language Translator",
      meta: "Computer Vision / Full-Stack ML App | Python, FastAPI, WebSockets, React, MediaPipe, PyTorch, ONNX",
      body: "A real-time ASL translation system that converts webcam hand gestures into text using computer vision, deep learning, and natural language processing.",
      items: [
        "Developed a React frontend and FastAPI WebSocket backend for webcam frame streaming, MediaPipe hand landmark extraction, and live predictions.",
        "Implemented static alphabet recognition with a PyTorch MLP exported to ONNX, dynamic gesture recognition using an LSTM sequence model, and GPT-2-based word suggestions.",
        "Added multi-frame consistency checks to reduce noisy live predictions.",
      ],
      links: [
        {
          href: "https://github.com/khodorrHajj/ASL-Real-Time-Sign-Language-Translator",
          label: "GitHub",
        },
      ],
    },
    {
      heading: "repo-analyzer - GitHub Repository Analyzer",
      meta: "Published Python CLI Tool | Python, Click, Rich, Requests, pytest, PyPI",
      body: "A Python CLI package for GitHub repository due diligence, helping developers and recruiters evaluate repository health directly from the terminal.",
      items: [
        "Built analysis for activity, community signals, maintenance, documentation, engineering hygiene, contributor risk, bus factor, ownership concentration, and overall health scoring.",
        "Implemented recruiter mode, side-by-side comparison, JSON/PDF export, GitHub token support, caching controls, and terminal-friendly Rich output.",
        "Packaged the tool for PyPI and added pytest-based support for CLI and analysis behavior.",
      ],
      links: [
        {
          href: "https://github.com/khodorrHajj/GithubRepoAnalyzer",
          label: "GitHub",
        },
        {
          href: "https://pypi.org/project/repo-analyzer",
          label: "PyPI",
        },
      ],
    },
    {
      heading: "Compiler Workbench",
      meta: "University / Team Project | C++17, Qt 6, qmake",
      body: "A desktop Qt application for exploring compiler construction concepts through an integrated visual workbench.",
      items: [
        "Implemented automata design, lexical analysis, grammar-based parsing, parse tree visualization, semantic analysis, AST inspection, symbol table handling, and basic target-code generation.",
        "Supported DFA/NFA creation, NFA-to-DFA conversion, DFA minimization, regex-to-automaton workflows, diagnostics, and code generation to Python, Java, JavaScript, and Assembly.",
        "Organized the app into domain models, processing utilities, and Qt UI modules for automata, grammar, lexical analysis, and semantic analysis.",
      ],
      links: [
        {
          href: "https://github.com/khodorrHajj/CompilerDesign",
          label: "GitHub",
        },
      ],
    },
  ],
  Skills: [
    {
      heading: "Strongest",
      tags: [
        "JavaScript",
        "TypeScript",
        "Python",
        "React",
        "Next.js",
        "FastAPI",
        "REST APIs",
        "SQL",
        "Git",
        "GitHub",
      ],
    },
    {
      heading: "Backend & Databases",
      tags: [
        "PostgreSQL",
        "SQLAlchemy",
        "Alembic",
        "MySQL",
        "SQLite",
        "JWT",
        "OAuth",
        "TOTP",
        "bcrypt",
      ],
    },
    {
      heading: "Frontend",
      tags: [
        "React",
        "Next.js",
        "Tailwind CSS",
        "HTML/CSS",
        "Three.js",
        "React Three Fiber",
        "Vite",
      ],
    },
    {
      heading: "Tools",
      tags: [
        "Docker",
        "Docker Compose",
        "pytest",
        "Click",
        "Rich",
        "Qt",
        "Linux/CLI basics",
      ],
    },
    {
      heading: "ML / Computer Vision",
      tags: ["MediaPipe", "OpenCV", "PyTorch", "ONNX", "scikit-learn"],
    },
    {
      heading: "Familiar / Class & Lab Experience",
      tags: ["C++", "C#", "PHP", "Laravel", ".NET", "MongoDB"],
    },
  ],
  Experience: [
    {
      heading: "Programming Instructor - Jtech & Istay",
      meta: "2024 - Present",
      body: "Taught programming and robotics fundamentals across 5 classes at Val Pere Jacques, SSCC Hadath, and Notre Dame De Jamhour.",
      items: [
        "Led beginner-friendly sessions using Arduino, Micro:bit, Tinkercad, Minecraft Education, and Microsoft Arcade.",
        "Helped students understand programming logic, electronics concepts, interactive projects, and problem-solving through hands-on exercises.",
      ],
    },
    {
      heading: "Waiter - DipnDip",
      meta: "Dec 2024 - Nov 2025",
      body: "Worked in a fast-paced customer-facing environment requiring communication, reliability, multitasking, and teamwork.",
    },
  ],
  Education: [
    {
      heading: "Antonine University",
      meta: "B.S. Computer Science | Expected Jan 2027",
      body: "Computer Science undergraduate focused on full-stack development, practical software projects, and software engineering fundamentals.",
    },
    {
      heading: "Languages",
      tags: ["Arabic - Native", "English - Fluent", "French - Intermediate"],
    },
  ],
  Contact: [
    {
      heading: "Email",
      body: "khodorhajjmoussa@gmail.com",
      links: [
        {
          href: "mailto:khodorhajjmoussa@gmail.com",
          label: "Send email",
        },
      ],
    },
    {
      heading: "Phone",
      body: "+961 70 626 913",
      links: [
        {
          href: "tel:+96170626913",
          label: "Call",
        },
      ],
    },
    {
      heading: "Location",
      body: "Betchay, Lebanon",
    },
    {
      heading: "GitHub",
      body: "github.com/khodorrHajj",
      links: [
        {
          href: "https://github.com/khodorrHajj",
          label: "Open GitHub",
        },
      ],
    },
    {
      heading: "Live Project",
      body: "lebanese-finance-tracker.vercel.app",
      links: [
        {
          href: "https://lebanese-finance-tracker.vercel.app",
          label: "Open app",
        },
      ],
    },
  ],
};

function getProjectedMeshRect(mesh, camera, viewportSize) {
  const geometry = mesh.geometry;
  if (!geometry) return null;

  if (!geometry.boundingBox) {
    geometry.computeBoundingBox();
  }

  const { min, max } = geometry.boundingBox;
  const corners = [
    new THREE.Vector3(min.x, min.y, min.z),
    new THREE.Vector3(min.x, min.y, max.z),
    new THREE.Vector3(min.x, max.y, min.z),
    new THREE.Vector3(min.x, max.y, max.z),
    new THREE.Vector3(max.x, min.y, min.z),
    new THREE.Vector3(max.x, min.y, max.z),
    new THREE.Vector3(max.x, max.y, min.z),
    new THREE.Vector3(max.x, max.y, max.z),
  ];

  let left = Number.POSITIVE_INFINITY;
  let top = Number.POSITIVE_INFINITY;
  let right = Number.NEGATIVE_INFINITY;
  let bottom = Number.NEGATIVE_INFINITY;

  for (const corner of corners) {
    corner.applyMatrix4(mesh.matrixWorld).project(camera);

    const x = (corner.x * 0.5 + 0.5) * viewportSize.width;
    const y = (-corner.y * 0.5 + 0.5) * viewportSize.height;

    left = Math.min(left, x);
    top = Math.min(top, y);
    right = Math.max(right, x);
    bottom = Math.max(bottom, y);
  }

  return {
    left,
    top,
    width: right - left,
    height: bottom - top,
  };
}

function makeInvisibleButClickable(material) {
  if (!material) return;

  material.transparent = true;
  material.opacity = 0;
  material.depthWrite = false;
  material.needsUpdate = true;
}

function Model({
  isScreenFocused,
  onScreenClick,
  onScreenReady,
  onScreenRectChange,
}) {
  const { scene } = useGLTF(MODEL_PATH);
  const { camera, size } = useThree();
  const model = useMemo(() => scene.clone(true), [scene]);
  const modelGroupRef = useRef(null);
  const screenMaterialRef = useRef(null);
  const screenHitboxRef = useRef(null);
  const lastScreenRectRef = useRef(null);

  useEffect(() => {
    model.traverse((child) => {
      if (child.name !== "Screen_Hitbox") return;

      const overlayMaterial = new THREE.MeshBasicMaterial({
        color: "#8f949c",
        transparent: true,
        opacity: 0,
        depthWrite: false,
        side: THREE.DoubleSide,
      });

      child.material = overlayMaterial;
      screenMaterialRef.current = overlayMaterial;
      screenHitboxRef.current = child;
    });

    return () => {
      screenMaterialRef.current?.dispose();
    };
  }, [model]);

  useEffect(() => {
    const screenMaterial = screenMaterialRef.current;
    if (!screenMaterial) return;

    screenMaterial.opacity = isScreenFocused ? 1 : 0;
    screenMaterial.color.set("#8f949c");
    screenMaterial.transparent = true;
    screenMaterial.depthWrite = false;
    screenMaterial.side = THREE.DoubleSide;
    screenMaterial.needsUpdate = true;
  }, [isScreenFocused]);

  useEffect(() => {
    const group = modelGroupRef.current;
    if (!group) return;

    let screenHitbox = null;
    group.traverse((child) => {
      if (child.name === "Screen_Hitbox") {
        screenHitbox = child;
      }
    });

    if (!screenHitbox) {
      console.warn("Screen_Hitbox was not found in the GLB.");
      return;
    }

    group.updateWorldMatrix(true, true);

    const screenBounds = new THREE.Box3().setFromObject(screenHitbox);
    const screenCenter = screenBounds.getCenter(new THREE.Vector3());

    onScreenReady({
      position: screenCenter.toArray(),
    });
  }, [model, onScreenReady]);

  useFrame(() => {
    if (!isScreenFocused) return;

    const screenHitbox = screenHitboxRef.current;
    if (!screenHitbox) return;

    screenHitbox.updateWorldMatrix(true, false);

    const nextRect = getProjectedMeshRect(screenHitbox, camera, size);
    if (!nextRect) return;

    const prevRect = lastScreenRectRef.current;
    const hasMeaningfulChange =
      !prevRect ||
      Math.abs(prevRect.left - nextRect.left) > 0.5 ||
      Math.abs(prevRect.top - nextRect.top) > 0.5 ||
      Math.abs(prevRect.width - nextRect.width) > 0.5 ||
      Math.abs(prevRect.height - nextRect.height) > 0.5;

    if (!hasMeaningfulChange) return;

    lastScreenRectRef.current = nextRect;
    onScreenRectChange(nextRect);
  });

  const handlePointerDown = (event) => {
    if (event.object.name !== "Screen_Hitbox") return;

    event.stopPropagation();
    console.log("Screen_Hitbox clicked", {
      objectName: event.object.name,
      point: event.point.toArray().map((value) => Number(value.toFixed(3))),
    });
    onScreenClick();
  };

  return (
    <Center>
      <group ref={modelGroupRef} rotation={[0, -Math.PI / 2, 0]}>
        <primitive object={model} onPointerDown={handlePointerDown} />
      </group>
    </Center>
  );
}

function Loader() {
  return (
    <Html center>
      <div className="loader">Loading 3D scene...</div>
    </Html>
  );
}

useGLTF.preload(MODEL_PATH);

function WelcomePopup({ isVisible, onEnterWorld }) {
  if (!isVisible) return null;

  return (
    <Html
      center
      className="scene-welcome"
      distanceFactor={1.7}
      position={INTRO_POPUP_POSITION}
      sprite
      transform
    >
      <section className="welcome-popup" aria-live="polite">
        <h1>Welcome to my portfolio</h1>
        <p className="welcome-popup__line">
          Click on the monitor screen to see my portfolio.
        </p>
        <button
          className="welcome-popup__button"
          onClick={onEnterWorld}
          type="button"
        >
          Explore the world
        </button>
      </section>
    </Html>
  );
}

function FolderIcon({ title, onOpen }) {
  return (
    <button
      className="desktop-folder"
      onClick={() => onOpen(title)}
      type="button"
    >
      <span className="desktop-folder__icon" aria-hidden="true">
        <svg viewBox="0 0 64 52" role="presentation">
          <path
            d="M6 14a6 6 0 0 1 6-6h14l5 6h21a6 6 0 0 1 6 6v20a8 8 0 0 1-8 8H12a8 8 0 0 1-8-8V14Z"
            fill="#f1bf42"
          />
          <path
            d="M4 20a6 6 0 0 1 6-6h42a6 6 0 0 1 6 6v4H4v-4Z"
            fill="#ffd56a"
          />
        </svg>
      </span>
      <span className="desktop-folder__label">{title}</span>
    </button>
  );
}

function DesktopWindow({ className = "", title, onClose }) {
  const sections = FOLDER_CONTENT[title];

  return (
    <section className={`desktop-window ${className}`.trim()}>
      <header className="desktop-window__header">
        <strong>{title}</strong>
        <button
          aria-label="Close window"
          className="desktop-window__close"
          onClick={onClose}
          type="button"
        >
          x
        </button>
      </header>
      <div className="desktop-window__body">
        {sections ? (
          sections.map((section) => (
            <section className="desktop-window__section" key={section.heading}>
              <h2>{section.heading}</h2>
              {section.meta ? (
                <p className="desktop-window__meta">{section.meta}</p>
              ) : null}
              {section.body ? <p>{section.body}</p> : null}
              {section.items ? (
                <ul className="desktop-window__list">
                  {section.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              ) : null}
              {section.tags ? (
                <div className="desktop-window__tags">
                  {section.tags.map((tag) => (
                    <span className="desktop-window__tag" key={tag}>
                      {tag}
                    </span>
                  ))}
                </div>
              ) : null}
              {section.links || section.link ? (
                <div className="desktop-window__links">
                  {(section.links ?? [
                    {
                      href: section.link,
                      label: section.linkLabel ?? "GitHub",
                    },
                  ]).map((link) => (
                    <a
                      className="desktop-window__link"
                      href={link.href}
                      key={link.href}
                      rel="noreferrer"
                      target={link.href.startsWith("http") ? "_blank" : undefined}
                    >
                      {link.label}
                    </a>
                  ))}
                </div>
              ) : null}
            </section>
          ))
        ) : (
          <>
            <p>{title}</p>
            <p>Placeholder content for the {title} folder.</p>
          </>
        )}
      </div>
    </section>
  );
}

function MobileFolderTab({ isActive, title, onOpen }) {
  return (
    <button
      className={`mobile-folder-tab${isActive ? " mobile-folder-tab--active" : ""}`}
      onClick={() => onOpen(title)}
      type="button"
    >
      {title}
    </button>
  );
}

function DesktopScreen({ isMobile, isVisible, opacity, screenRect }) {
  const [openWindow, setOpenWindow] = useState(null);

  useEffect(() => {
    if (!isVisible) {
      setOpenWindow(null);
    }
  }, [isVisible]);

  if (!isVisible || !screenRect) return null;

  if (isMobile) {
    return (
      <section className="desktop-screen desktop-screen--mobile" style={{ opacity }}>
        <div className="desktop-screen__mobile-shell">
          <div className="desktop-screen__mobile-folders">
            {DESKTOP_FOLDERS.map((folder) => (
              <MobileFolderTab
                key={folder}
                isActive={openWindow === folder}
                onOpen={setOpenWindow}
                title={folder}
              />
            ))}
          </div>

          {openWindow ? (
            <DesktopWindow
              className="desktop-window--mobile"
              title={openWindow}
              onClose={() => setOpenWindow(null)}
            />
          ) : (
            <section className="desktop-screen__mobile-placeholder">
              <p>Tap a folder to open it.</p>
            </section>
          )}
        </div>
      </section>
    );
  }

  return (
    <section className="desktop-screen">
      <div
        className="desktop-screen__anchor"
        style={{
          left: `${screenRect.left}px`,
          opacity,
          top: `${screenRect.top}px`,
          width: `${screenRect.width}px`,
          height: `${screenRect.height}px`,
        }}
      >
        <div className="desktop-screen__surface">
          <div className="desktop-screen__folders">
            {DESKTOP_FOLDERS.map((folder) => (
              <FolderIcon key={folder} title={folder} onOpen={setOpenWindow} />
            ))}
          </div>

          {openWindow ? (
            <DesktopWindow
              title={openWindow}
              onClose={() => setOpenWindow(null)}
            />
          ) : null}
        </div>
      </div>
    </section>
  );
}

function CameraDebug({ controlsRef }) {
  const { camera } = useThree();

  useEffect(() => {
    if (!import.meta.env.DEV) return undefined;

    const controls = controlsRef.current;
    if (!controls) return undefined;

    const logState = () => {
      const position = camera.position
        .toArray()
        .map((value) => Number(value.toFixed(3)));
      const target = controls.target
        .toArray()
        .map((value) => Number(value.toFixed(3)));

      console.log("[R3F camera]", { position, target });
    };

    logState();
    controls.addEventListener("change", logState);

    return () => controls.removeEventListener("change", logState);
  }, [camera, controlsRef]);

  return null;
}

function CameraRig({
  controlsRef,
  hasEnteredWorld,
  isScreenFocused,
  isMobile,
  isRoomTransitioning,
  onScreenRevealChange,
  screenTarget,
}) {
  const { camera } = useThree();
  const introPosition = useMemo(
    () => new THREE.Vector3(...INTRO_CAMERA_POSITION),
    [],
  );
  const introTarget = useMemo(() => new THREE.Vector3(...INTRO_TARGET), []);
  const roomPosition = useMemo(
    () => new THREE.Vector3(...ROOM_CAMERA_POSITION),
    [],
  );

  const roomTarget = useMemo(() => new THREE.Vector3(...ROOM_TARGET), []);

  const desiredPosition = useRef(roomPosition.clone());
  const desiredTarget = useRef(roomTarget.clone());

  useFrame((_, delta) => {
    const controls = controlsRef.current;
    if (!controls) return;

    let nextReveal = 0;

    if (!hasEnteredWorld) {
      desiredPosition.current.copy(introPosition);
      desiredTarget.current.copy(introTarget);
    } else if (isScreenFocused && screenTarget) {
      const screenCenter = new THREE.Vector3(...screenTarget.position);
      const directionFromScreenToRoomCamera = roomPosition
        .clone()
        .sub(screenCenter);
      directionFromScreenToRoomCamera.y = 0;

      if (directionFromScreenToRoomCamera.lengthSq() === 0) {
        directionFromScreenToRoomCamera.set(0, 0, 1);
      } else {
        directionFromScreenToRoomCamera.normalize();
      }

      const leftVector = new THREE.Vector3()
        .crossVectors(
          directionFromScreenToRoomCamera,
          new THREE.Vector3(0, 0, 0),
        )
        .normalize();
      const focusTarget = screenCenter
        .clone()
        .add(leftVector.multiplyScalar(0.08));

      const focusDistance = isMobile ? 0.78 : 1.15;
      const focusPosition = screenCenter
        .clone()
        .add(directionFromScreenToRoomCamera.multiplyScalar(focusDistance));
      focusPosition.y = screenCenter.y;

      const totalDistance = roomPosition.distanceTo(focusPosition);
      desiredPosition.current.copy(focusPosition);
      desiredTarget.current.copy(focusTarget);

      const currentDistance = camera.position.distanceTo(focusPosition);
      const travelProgress = THREE.MathUtils.clamp(
        1 - currentDistance / Math.max(totalDistance, 0.001),
        0,
        1,
      );
      nextReveal = THREE.MathUtils.smoothstep(
        travelProgress,
        isMobile ? 0.82 : 0.9,
        isMobile ? 0.93 : 0.955,
      );
    } else if (isRoomTransitioning) {
      desiredPosition.current.copy(roomPosition);
      desiredTarget.current.copy(roomTarget);
    } else {
      onScreenRevealChange(nextReveal);
      return;
    }

    const damping = 1 - Math.exp(-4 * delta);
    camera.position.lerp(desiredPosition.current, damping);
    controls.target.lerp(desiredTarget.current, damping);
    controls.update();
    onScreenRevealChange(nextReveal);
  });

  return null;
}

export default function App() {
  const controlsRef = useRef(null);
  const [hasEnteredWorld, setHasEnteredWorld] = useState(false);
  const [isScreenFocused, setIsScreenFocused] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isRoomTransitioning, setIsRoomTransitioning] = useState(false);
  const [isMobileScreenUiVisible, setIsMobileScreenUiVisible] = useState(false);
  const [screenReveal, setScreenReveal] = useState(0);
  const [screenTarget, setScreenTarget] = useState(null);
  const [screenRect, setScreenRect] = useState(null);

  useEffect(() => {
    const mediaQuery = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`);
    const updateIsMobile = () => setIsMobile(mediaQuery.matches);

    updateIsMobile();
    mediaQuery.addEventListener("change", updateIsMobile);

    return () => mediaQuery.removeEventListener("change", updateIsMobile);
  }, []);

  useEffect(() => {
    if (!isMobile) {
      setIsMobileScreenUiVisible(false);
      return undefined;
    }

    if (!isScreenFocused) {
      setIsMobileScreenUiVisible(false);
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setIsMobileScreenUiVisible(true);
    }, MOBILE_SCREEN_UI_DELAY_MS);

    return () => window.clearTimeout(timeoutId);
  }, [isMobile, isScreenFocused]);

  useEffect(() => {
    if (!hasEnteredWorld || isScreenFocused) return undefined;

    setIsRoomTransitioning(true);

    const timeoutId = window.setTimeout(() => {
      setIsRoomTransitioning(false);
    }, ROOM_TRANSITION_MS);

    return () => window.clearTimeout(timeoutId);
  }, [hasEnteredWorld, isScreenFocused]);

  return (
    <main className="app-shell">
      {!hasEnteredWorld ? <div className="intro-scene-blur" aria-hidden="true" /> : null}

      {isScreenFocused ? (
        <button
          className="back-button"
          onClick={() => {
            setIsScreenFocused(false);
            setIsRoomTransitioning(true);
          }}
          type="button"
        >
          Back to room
        </button>
      ) : null}

      <DesktopScreen
        isMobile={isMobile}
        isVisible={isMobile ? isMobileScreenUiVisible : isScreenFocused}
        opacity={isMobile ? 1 : screenReveal}
        screenRect={screenRect}
      />

      <Canvas
        camera={{
          position: INTRO_CAMERA_POSITION,
          fov: 60,
          near: 0.1,
          far: 200,
        }}
        dpr={[1, 1.5]}
        shadows
      >
        <color attach="background" args={["#0b1020"]} />
        <ambientLight intensity={1.2} />
        <directionalLight
          castShadow
          intensity={2.2}
          position={[8, 12, 10]}
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        <directionalLight intensity={0.8} position={[-6, 5, -8]} />

        <Suspense fallback={<Loader />}>
          <Model
            isScreenFocused={isScreenFocused}
            onScreenClick={() => {
              if (!hasEnteredWorld) return;
              setIsScreenFocused(true);
            }}
            onScreenReady={setScreenTarget}
            onScreenRectChange={setScreenRect}
          />
          <WelcomePopup
            isVisible={!hasEnteredWorld}
            onEnterWorld={() => {
              setHasEnteredWorld(true);
              setIsRoomTransitioning(true);
            }}
          />
        </Suspense>

        <OrbitControls
          ref={controlsRef}
          enableDamping
          dampingFactor={0.08}
          target={INTRO_TARGET}
          enablePan={false}
          enableZoom={hasEnteredWorld && !isScreenFocused}
          enableRotate={hasEnteredWorld && !isScreenFocused}
          minAzimuthAngle={-Math.PI / 4}
          minDistance={isScreenFocused ? 0.9 : 2}
          maxAzimuthAngle={Math.PI / 4}
          maxDistance={isScreenFocused ? 2 : 20}
          maxPolarAngle={Math.PI / 2 + Math.PI / 9}
          minPolarAngle={Math.PI / 2 - Math.PI / 9}
        />
        <CameraRig
          controlsRef={controlsRef}
          hasEnteredWorld={hasEnteredWorld}
          isScreenFocused={isScreenFocused}
          isMobile={isMobile}
          isRoomTransitioning={isRoomTransitioning}
          onScreenRevealChange={setScreenReveal}
          screenTarget={screenTarget}
        />
        <CameraDebug controlsRef={controlsRef} />
      </Canvas>
    </main>
  );
}
