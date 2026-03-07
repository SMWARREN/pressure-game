import { GameFooter } from './game/GameFooter';
import ReplayOverlay from '@/components/game/ReplayOverlay';
import { WalkthroughOverlay } from './WalkthroughOverlay';
import UnlimitedRulesDialog from './UnlimitedRulesDialog';
import HowToPlayModal from './HowToPlayModal';
import { FeatureInfoSheet } from './modals/FeatureInfoSheet';
import { EditorToolbar } from './editor/EditorToolbar';
import { NotificationLog } from './game/NotificationLog';
import { SyncStatusIndicator } from './game/SyncStatusIndicator';
import { useGameStore } from '@/game/store';

export function renderOverlays(props: any) {
  const {
    replayEngine,
    replayEvent,
    setReplayEvent,
    walkthroughActive,
    walkthroughConfig,
    walkthroughStepIndex,
    advanceWalkthrough,
    skipWalkthrough,
    walkthroughStep,
    boardRef,
    gs,
    startGame,
    showUnlimitedRules,
    currentLevel,
    unlimitedPreviousScore,
    handleUnlimitedStart,
    goToMenu,
    currentModeId,
    onWatchBestUnlimited,
  } = props;

  return (
    <>
      {replayEngine && replayEvent && (
        <ReplayOverlay
          event={replayEvent}
          engine={replayEngine}
          onClose={() => setReplayEvent(null)}
        />
      )}
      {walkthroughActive && walkthroughConfig && (
        <WalkthroughOverlay
          steps={walkthroughConfig.steps}
          currentStepIndex={walkthroughStepIndex}
          onAdvance={advanceWalkthrough}
          onSkip={skipWalkthrough}
          targetTile={walkthroughStep?.targetTile}
          boardRef={boardRef}
          gridSize={gs}
          onStartGame={startGame}
        />
      )}
      {showUnlimitedRules && currentLevel && (
        <UnlimitedRulesDialog
          levelName={currentLevel.name}
          previousScore={unlimitedPreviousScore}
          onStart={handleUnlimitedStart}
          onBack={goToMenu}
          modeId={currentModeId}
          features={currentLevel.features}
          onWatchBest={onWatchBestUnlimited}
        />
      )}
    </>
  );
}

export function renderModalsAndExtras(props: any) {
  const {
    showHowToPlay,
    setShowHowToPlay,
    showFeatureInfo,
    setShowFeatureInfo,
    editor,
    colors,
    tiles,
    setEditorTool,
    showNotification,
  } = props;

  return (
    <>
      {showHowToPlay && <HowToPlayModal onClose={() => setShowHowToPlay(false)} />}
      <FeatureInfoSheet feature={showFeatureInfo} onClose={() => setShowFeatureInfo(null)} />
      {editor.enabled && (
        <div
          style={{
            position: 'fixed',
            left: '50%',
            bottom: 100,
            transform: 'translateX(-50%)',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            padding: '8px 12px',
            background: colors.game.overlay,
            borderRadius: 16,
            border: `1px solid ${colors.status.info}40`,
            boxShadow: `0 4px 24px ${colors.status.info}33`,
            zIndex: 100,
            maxWidth: '95vw',
          }}
        >
          <EditorToolbar
            editor={editor}
            tiles={tiles}
            setEditorTool={setEditorTool}
            showNotification={showNotification}
          />
        </div>
      )}
    </>
  );
}

export function renderFixedElements(props: any) {
  const { status, notifLog, mode, vw } = props;
  return (
    <>
      {status === 'playing' && (
        <NotificationLog notifLog={notifLog} mode={mode} viewportWidth={vw} boardMaxWidth={238} />
      )}
      <div
        style={{
          position: 'fixed',
          top: 'max(12px, env(safe-area-inset-top))',
          right: 12,
          zIndex: 9999,
          pointerEvents: 'none',
        }}
      >
        <SyncStatusIndicator />
      </div>
    </>
  );
}

export function shouldShowOverlay(props: any): boolean {
  const { isUnlimited, showUnlimitedRules, walkthroughActive, isPaused, editorEnabled } = props;
  return !(isUnlimited && showUnlimitedRules) && !walkthroughActive && !isPaused && !editorEnabled;
}

export function shouldShowPauseOverlay(isPaused: boolean, editorEnabled: boolean): boolean {
  return isPaused && !editorEnabled;
}

export function getTransformStyle(animationsEnabled: boolean, screenShake: boolean): string {
  return animationsEnabled && screenShake ? 'translateX(-4px)' : 'none';
}

export function getTransitionStyle(animationsEnabled: boolean, screenShake: boolean): string {
  return animationsEnabled && screenShake ? 'none' : 'transform 0.05s ease';
}

export function getBoardBorderColor(wallsJustAdvanced: boolean, colors: any): string {
  return wallsJustAdvanced ? colors.status.error + '50' : colors.border.primary;
}

export function getBoardBoxShadow(wallsJustAdvanced: boolean, colors: any): string {
  return wallsJustAdvanced
    ? `0 0 40px ${colors.status.error}4d, inset 0 0 40px ${colors.status.error}0d`
    : `0 0 60px rgba(0,0,0,0.8), inset 0 0 40px rgba(0,0,0,0.2)`;
}

export function renderNotification(props: any) {
  const { notification, mode } = props;
  if (!notification) return null;
  return (
    <div
      key={notification.key}
      style={{
        position: 'absolute',
        top: -24,
        left: '50%',
        animation: 'notifFloat 1.4s ease forwards',
        fontSize: 15,
        fontWeight: 900,
        color: notification.isScore ? mode.color : '#fbbf24',
        letterSpacing: '0.05em',
        pointerEvents: 'none',
        zIndex: 20,
        whiteSpace: 'nowrap',
        textShadow: `0 0 12px ${notification.isScore ? mode.color : '#fbbf24'}99`,
      }}
    >
      {notification.text}
    </div>
  );
}

export function renderFooter(props: any) {
  const {
    editor,
    iconBtn,
    editorButtonStyles,
    editorButtonTitle,
    editorButtonIcon,
    toggleEditor,
    gs,
    showUndoBtn,
    showHintBtn,
    timeStr,
    showHint,
    isComputingSolution,
    isPaused,
    status,
    animationsEnabled,
    history,
    undoMove,
    solution,
    computeSolution,
    resumeGame,
    pauseGame,
    setShowHint,
    setShowHowToPlay,
    toggleAnimations,
    colors,
  } = props;

  return (
    <footer
      style={{
        width: '100%',
        flexShrink: 0,
        position: 'relative',
        zIndex: 10,
        borderTop: `1px solid ${colors.border.primary}`,
        background: colors.game.footer,
        backdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 'clamp(10px, 3vw, 20px)',
        padding: 'clamp(8px, 1.5vh, 12px) 16px max(10px, env(safe-area-inset-bottom))',
      }}
    >
      <button
        onClick={toggleEditor}
        style={{ ...iconBtn, ...editorButtonStyles }}
        title={editorButtonTitle}
      >
        <span style={{ fontSize: 16 }}>{editorButtonIcon}</span>
      </button>

      {editor.enabled ? (
        <>
          <button
            onClick={() => useGameStore.getState().editorResizeGrid(-1)}
            style={{ ...iconBtn, color: '#a855f7', border: '1px solid #a855f740' }}
            title="Decrease Grid"
          >
            <span style={{ fontSize: 18 }}>−</span>
          </button>
          <div
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 44 }}
          >
            <div style={{ fontSize: 14, fontWeight: 900, color: '#a855f7' }}>
              {editor.gridSize ?? gs}×{editor.gridSize ?? gs}
            </div>
            <div style={{ fontSize: 8, color: '#3a3a55', letterSpacing: '0.1em' }}>GRID</div>
          </div>
          <button
            onClick={() => useGameStore.getState().editorResizeGrid(1)}
            style={{ ...iconBtn, color: '#a855f7', border: '1px solid #a855f740' }}
            title="Increase Grid"
          >
            <span style={{ fontSize: 18 }}>+</span>
          </button>
        </>
      ) : (
        <GameFooter
          showUndoBtn={showUndoBtn}
          showHintBtn={showHintBtn}
          timeStr={timeStr}
          showHint={showHint}
          isComputingSolution={isComputingSolution}
          isPaused={isPaused}
          status={status}
          animationsEnabled={animationsEnabled}
          history={history}
          iconBtn={iconBtn}
          onUndo={undoMove}
          onHint={() => {
            if (solution === null && !isComputingSolution) computeSolution();
            setShowHint((h: boolean) => !h);
          }}
          onPauseResume={() => (isPaused ? resumeGame : pauseGame)()}
          onHowToPlay={() => setShowHowToPlay(true)}
          onToggleAnimations={toggleAnimations}
          computeSolution={computeSolution}
        />
      )}
    </footer>
  );
}
