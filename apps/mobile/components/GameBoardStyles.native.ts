import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#06060f',
  },

  // Header
  header: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#12122a',
    backgroundColor: 'rgba(6,6,15,0.9)',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  levelName: {
    fontSize: 16,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: -0.3,
  },
  levelSub: {
    fontSize: 9,
    color: '#555577',
    letterSpacing: 2,
    marginTop: 1,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1a1a35',
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconBtnText: {
    fontSize: 18,
    color: '#c0c8d8',
    fontWeight: '700',
  },

  // Feature indicators
  featureRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#12122a',
  },
  featureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  featureIcon: {
    width: 14,
    height: 14,
  },
  featureIconText: {
    fontSize: 12,
  },
  featureLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  featureCount: {
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
    marginLeft: 2,
  },
  featureCountText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#000',
  },

  // Stats
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#12122a',
    backgroundColor: 'rgba(6,6,15,0.85)',
  },
  statBox: {
    width: 56,
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1a1a35',
    backgroundColor: '#0a0a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statBig: {
    fontSize: 20,
    fontWeight: '900',
    color: '#fff',
    lineHeight: 24,
  },
  statSub: {
    fontSize: 9,
    color: '#4a4a6a',
    letterSpacing: 0.5,
  },
  compressionWrap: {
    flex: 1,
    gap: 4,
  },
  compressionLabel: {
    fontSize: 9,
    color: '#4a4a6a',
    letterSpacing: 2,
  },
  compressionTrack: {
    height: 5,
    backgroundColor: '#1a1a35',
    borderRadius: 3,
    overflow: 'hidden',
  },
  compressionFill: {
    height: '100%',
    backgroundColor: '#6366f1',
    borderRadius: 3,
  },
  compressionStatus: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
  },

  // Grid
  gridWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
  },
  boardBorder: {
    borderWidth: 1,
    borderColor: 'rgba(30,30,70,0.8)',
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#0a0a14',
  },

  // Footer
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#12122a',
    backgroundColor: 'rgba(6,6,15,0.92)',
  },
  footerBtn: {
    width: 44,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1a1a35',
    backgroundColor: '#0a0a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerBtnDisabled: {
    opacity: 0.3,
  },
  footerBtnText: {
    fontSize: 16,
    color: '#a0aec0',
  },
  footerIcon: {
    width: 20,
    height: 20,
  },
  footerTimeWrap: {
    alignItems: 'center',
    minWidth: 44,
  },
  footerTime: {
    fontSize: 20,
    fontWeight: '900',
    color: '#fff',
  },
  footerTimeLabel: {
    fontSize: 8,
    color: '#4a4a6a',
    letterSpacing: 2,
  },

  // Overlays (idle / win / loss)
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(6,6,15,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    zIndex: 100,
    padding: 24,
  },
  overlayLabel: {
    fontSize: 11,
    color: '#4a4a6a',
    letterSpacing: 3,
    marginBottom: 2,
  },
  overlayLevelSub: {
    fontSize: 10,
    color: '#4a4a6a',
    letterSpacing: 2,
    marginBottom: 20,
  },
  overlayEmoji: {
    fontSize: 36,
    color: '#22c55e',
    marginBottom: 2,
  },
  overlayTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 1,
  },
  overlaySub: {
    fontSize: 11,
    color: '#4a4a6a',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  overlayRecord: {
    fontSize: 10,
    color: '#3a3a55',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  overlayBtnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  overlayBtn: {
    paddingHorizontal: 22,
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 0,
    alignItems: 'center',
    minWidth: 90,
  },
  overlayBtnPrimary: {
    backgroundColor: '#6366f1',
  },
  overlayBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 1,
  },
  overlayBtnSecondary: {
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#1e1e35',
    backgroundColor: 'rgba(255,255,255,0.03)',
    alignItems: 'center',
    minWidth: 80,
  },
  overlayBtnSecondaryText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#a5b4fc',
    letterSpacing: 0.5,
  },
});
