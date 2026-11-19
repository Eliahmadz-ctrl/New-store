import React, { useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'

const iconPaths = {
  grid: <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
  video: <><rect x="3" y="5" width="13" height="14" rx="2"/><path d="m16 10 5-3v10l-5-3z"/></>,
  folder: <path d="M3 6.5A2.5 2.5 0 0 1 5.5 4H10l2 2h6.5A2.5 2.5 0 0 1 21 8.5v9a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 17.5z"/>,
  arrowUp: <><path d="M12 20V4"/><path d="m6 10 6-6 6 6"/></>,
  play: <path d="m8 5 11 7-11 7z" fill="currentColor" stroke="none"/>,
  pause: <><path d="M8 5v14"/><path d="M16 5v14"/></>,
  back: <><path d="m15 18-6-6 6-6"/><path d="M21 12H9"/></>,
  forward: <><path d="m9 18 6-6-6-6"/><path d="M3 12h12"/></>,
  sparkles: <><path d="m12 3-1.45 5.55L5 10l5.55 1.45L12 17l1.45-5.55L19 10l-5.55-1.45z"/><path d="m19 17-.65 2.35L16 20l2.35.65L19 23l.65-2.35L22 20l-2.35-.65z" transform="translate(0 -2)"/></>,
  captions: <><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M7.5 12h3M13.5 12h3M7.5 15h6"/></>,
  settings: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.1 2.1-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.03 1.56v.1h-3v-.1A1.7 1.7 0 0 0 10.7 18.6a1.7 1.7 0 0 0-1.88.34l-.06.06-2.1-2.1.06-.06A1.7 1.7 0 0 0 7.06 15 1.7 1.7 0 0 0 5.5 14H5.4v-3h.1A1.7 1.7 0 0 0 7.06 10a1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.1-2.1.06.06A1.7 1.7 0 0 0 10.7 6.36a1.7 1.7 0 0 0 1.03-1.56v-.1h3v.1a1.7 1.7 0 0 0 1.03 1.56 1.7 1.7 0 0 0 1.88-.34l.06-.06 2.1 2.1-.06.06A1.7 1.7 0 0 0 19.4 10a1.7 1.7 0 0 0 1.56 1h.1v3h-.1A1.7 1.7 0 0 0 19.4 15Z"/></>,
  help: <><circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.65 2.65 0 1 1 4.58 1.82c-.95.95-2.08 1.36-2.08 2.68"/><path d="M12 17h.01"/></>,
  plus: <><path d="M12 5v14"/><path d="M5 12h14"/></>,
  check: <path d="m5 12 4.2 4.2L19 6.5"/>,
  copy: <><rect x="8" y="8" width="11" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h2"/></>,
  scissors: <><circle cx="6" cy="6" r="2.2"/><circle cx="6" cy="18" r="2.2"/><path d="m8 7.5 10 9"/><path d="m8 16.5 3.3-3"/><path d="m14.6 10.5 3.4-3"/></>,
  close: <><path d="m6 6 12 12"/><path d="m18 6-12 12"/></>,
  download: <><path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 20h14"/></>,
  lock: <><rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></>,
  more: <><circle cx="5" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1" fill="currentColor" stroke="none"/></>,
  chevron: <path d="m8 10 4 4 4-4"/>,
  undo: <><path d="M9 7 4 12l5 5"/><path d="M4 12h10a6 6 0 0 1 6 6"/></>,
  redo: <><path d="m15 7 5 5-5 5"/><path d="M20 12H10a6 6 0 0 0-6 6"/></>,
  expand: <><path d="M8 3H3v5"/><path d="m3 3 6 6"/><path d="M16 3h5v5"/><path d="m21 3-6 6"/><path d="M8 21H3v-5"/><path d="m3 21 6-6"/><path d="M16 21h5v-5"/><path d="m21 21-6-6"/></>,
  wave: <><path d="M3 12h2l1.5-5 3 10 2-14 2.5 18 2-9 1.5 3H21"/></>,
  magic: <><path d="m4 20 15-15"/><path d="m14 5 1-2 1 2 2 1-2 1-1 2-1-2-2-1z"/><path d="m5 14 1.25-2.75L9 10l-2.75-1.25L5 6l-1.25 2.75L1 10l2.75 1.25z"/></>
}

function Icon({ name, size = 18, stroke = 1.8, className = '' }) {
  return <svg className={`icon ${className}`} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{iconPaths[name]}</svg>
}

const formatTime = (seconds) => {
  if (!Number.isFinite(seconds)) return '00:00.0'
  const min = Math.floor(seconds / 60)
  const sec = (seconds % 60).toFixed(1).padStart(4, '0')
  return `${String(min).padStart(2, '0')}:${sec}`
}

const prettyDuration = (seconds) => {
  const whole = Math.max(0, Math.round(seconds))
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`
}

const ASPECTS = [
  { label: '9:16', value: '9 / 16', name: 'Vertical' },
  { label: '1:1', value: '1 / 1', name: 'Square' },
  { label: '16:9', value: '16 / 9', name: 'Landscape' },
  { label: '4:5', value: '4 / 5', name: 'Portrait' },
]

const initialClips = [
  { id: 1, title: 'The product hook', range: [19, 44.5], label: '25.5s', color: 'purple' },
  { id: 2, title: 'Why this matters', range: [47.8, 67.1], label: '19.3s', color: 'gold' },
  { id: 3, title: 'Closing takeaway', range: [69.5, 81.8], label: '12.3s', color: 'mint' },
]

function App() {
  const [activeNav, setActiveNav] = useState('Studio')
  const [clips, setClips] = useState(initialClips)
  const [activeClipId, setActiveClipId] = useState(1)
  const [duration, setDuration] = useState(82)
  const [playhead, setPlayhead] = useState(22.4)
  const [isPlaying, setIsPlaying] = useState(false)
  const [sourceFile, setSourceFile] = useState(null)
  const [sourceUrl, setSourceUrl] = useState('')
  const [captionText, setCaptionText] = useState('The faster you ship, the faster you learn.')
  const [captionsOn, setCaptionsOn] = useState(true)
  const [captionStyle, setCaptionStyle] = useState('Pop')
  const [aspect, setAspect] = useState(ASPECTS[0])
  const [notice, setNotice] = useState('')
  const [isExporting, setIsExporting] = useState(false)
  const [exportProgress, setExportProgress] = useState(0)
  const [copyLabel, setCopyLabel] = useState('Copy link')
  const [saved, setSaved] = useState(false)
  const videoRef = useRef(null)
  const fileInputRef = useRef(null)
  const objectUrlRef = useRef('')
  const exporterStopRef = useRef(null)

  const activeClip = clips.find((clip) => clip.id === activeClipId) || clips[0]
  const [clipStart, clipEnd] = activeClip.range
  const clipLength = Math.max(0, clipEnd - clipStart)
  const previewTime = Math.min(Math.max(playhead, clipStart), clipEnd)

  useEffect(() => {
    const savedProject = window.localStorage.getItem('cliproom-project')
    if (savedProject) setSaved(true)
    return () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current)
    }
  }, [])

  useEffect(() => {
    const onKey = (event) => {
      const target = event.target
      if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) return
      if (event.code === 'Space') {
        event.preventDefault()
        togglePlayback()
      }
      if (event.key.toLowerCase() === 'i') updateRange('start', Math.max(0, playhead))
      if (event.key.toLowerCase() === 'o') updateRange('end', Math.min(duration, playhead))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  useEffect(() => {
    if (!notice) return undefined
    const id = window.setTimeout(() => setNotice(''), 3400)
    return () => window.clearTimeout(id)
  }, [notice])

  function updateRange(bound, rawValue) {
    const value = Number(rawValue)
    setClips((current) => current.map((clip) => {
      if (clip.id !== activeClipId) return clip
      const [start, end] = clip.range
      let nextRange
      if (bound === 'start') nextRange = [Math.min(value, end - 0.2), end]
      else nextRange = [start, Math.max(value, start + 0.2)]
      return { ...clip, range: nextRange, label: `${(nextRange[1] - nextRange[0]).toFixed(1)}s` }
    }))
    if (bound === 'start' && playhead < value) setPlayhead(value)
    if (bound === 'end' && playhead > value) setPlayhead(value)
  }

  function selectClip(id) {
    const next = clips.find((clip) => clip.id === id)
    if (!next) return
    setActiveClipId(id)
    setPlayhead(next.range[0])
  }

  function addClip() {
    const start = Math.min(Math.max(playhead, 0), Math.max(0, duration - 8))
    const end = Math.min(duration, start + 15)
    const id = Date.now()
    const newClip = { id, title: `New highlight ${clips.length + 1}`, range: [start, end], label: `${(end - start).toFixed(1)}s`, color: 'blue' }
    setClips((current) => [...current, newClip])
    setActiveClipId(id)
    setNotice('New highlight created from the playhead.')
  }

  function handleUpload(event) {
    const file = event.target.files?.[0]
    if (!file) return
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current)
    const nextUrl = URL.createObjectURL(file)
    objectUrlRef.current = nextUrl
    setSourceFile(file)
    setSourceUrl(nextUrl)
    setNotice(`${file.name} is ready to clip.`)
  }

  function onVideoMetadata() {
    const nextDuration = videoRef.current?.duration
    if (Number.isFinite(nextDuration) && nextDuration > 0) {
      setDuration(nextDuration)
      const end = Math.min(nextDuration, Math.max(1, nextDuration * 0.32))
      const start = Math.max(0, Math.min(1, end - 0.2))
      setClips([{ id: 1, title: 'First highlight', range: [start, end], label: `${(end - start).toFixed(1)}s`, color: 'purple' }])
      setActiveClipId(1)
      setPlayhead(start)
    }
  }

  function onVideoTime() {
    const video = videoRef.current
    if (!video) return
    setPlayhead(video.currentTime)
    if (video.currentTime >= clipEnd) {
      video.pause()
      video.currentTime = clipStart
      setIsPlaying(false)
    }
  }

  async function togglePlayback() {
    const video = videoRef.current
    if (!video || !sourceUrl) {
      setIsPlaying((value) => !value)
      setNotice('Add a video to preview this cut. Your clip settings are already ready.')
      return
    }
    if (video.paused) {
      if (video.currentTime < clipStart || video.currentTime > clipEnd) video.currentTime = clipStart
      try {
        await video.play()
        setIsPlaying(true)
      } catch {
        setNotice('Playback needs a quick click in the preview first.')
      }
    } else {
      video.pause()
      setIsPlaying(false)
    }
  }

  function saveProject() {
    const project = { clips, activeClipId, captionText, captionsOn, captionStyle, aspect: aspect.label, savedAt: new Date().toISOString() }
    window.localStorage.setItem('cliproom-project', JSON.stringify(project))
    setSaved(true)
    setNotice('Project saved locally in this browser.')
  }

  function downloadClipPlan() {
    const plan = {
      title: activeClip.title,
      source: sourceFile?.name || 'Demo source',
      in: Number(clipStart.toFixed(2)),
      out: Number(clipEnd.toFixed(2)),
      duration: Number(clipLength.toFixed(2)),
      aspectRatio: aspect.label,
      captions: captionsOn ? { text: captionText, style: captionStyle } : false,
      createdWith: 'Cliproom'
    }
    const blob = new Blob([JSON.stringify(plan, null, 2)], { type: 'application/json' })
    const anchor = document.createElement('a')
    anchor.href = URL.createObjectURL(blob)
    anchor.download = `${activeClip.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'clip'}-plan.json`
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    URL.revokeObjectURL(anchor.href)
  }

  async function exportCut() {
    if (!sourceUrl || !videoRef.current) {
      downloadClipPlan()
      setNotice('A clip plan was downloaded. Add a source video to export a WebM cut.')
      return
    }
    const video = videoRef.current
    const stream = video.captureStream?.() || video.mozCaptureStream?.()
    if (!stream || typeof MediaRecorder === 'undefined') {
      downloadClipPlan()
      setNotice('This browser cannot export directly, so your clip plan was downloaded.')
      return
    }

    const types = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm']
    const mimeType = types.find((type) => MediaRecorder.isTypeSupported(type))
    const chunks = []
    let recorder
    try {
      recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
    } catch {
      downloadClipPlan()
      setNotice('Could not start a direct export. Your clip plan was downloaded.')
      return
    }

    setIsExporting(true)
    setExportProgress(0)
    video.pause()
    video.currentTime = clipStart
    await new Promise((resolve) => video.addEventListener('seeked', resolve, { once: true }))

    recorder.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data) }
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: mimeType || 'video/webm' })
      const anchor = document.createElement('a')
      anchor.href = URL.createObjectURL(blob)
      anchor.download = `${activeClip.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'clip'}.webm`
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      window.setTimeout(() => URL.revokeObjectURL(anchor.href), 500)
      setIsExporting(false)
      setExportProgress(100)
      setNotice('Your source cut is ready. Captions and crop settings are saved with the project.')
    }
    recorder.start(250)
    await video.play()
    const updateProgress = () => {
      const progress = Math.min(99, Math.max(0, ((video.currentTime - clipStart) / clipLength) * 100))
      setExportProgress(progress)
      if (video.currentTime >= clipEnd || video.ended) {
        video.pause()
        if (recorder.state !== 'inactive') recorder.stop()
      } else {
        exporterStopRef.current = requestAnimationFrame(updateProgress)
      }
    }
    exporterStopRef.current = requestAnimationFrame(updateProgress)
  }

  function copyLink() {
    const link = `cliproom.local/clip/${activeClip.id}`
    navigator.clipboard?.writeText(link)
    setCopyLabel('Copied!')
    window.setTimeout(() => setCopyLabel('Copy link'), 1500)
  }

  const clipPercentStart = (clipStart / duration) * 100
  const clipPercentWidth = (clipLength / duration) * 100

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark"><span></span><span></span><span></span></div><span>cliproom</span></div>
      <div className="workspace-switch"><span className="workspace-avatar">E</span><span className="workspace-name">Eliah's space</span><Icon name="chevron" size={16} /></div>
      <nav className="main-nav" aria-label="Main navigation">
        {[
          ['Studio', 'grid'], ['Projects', 'video'], ['Library', 'folder']
        ].map(([label, icon]) => <button className={`nav-item ${activeNav === label ? 'active' : ''}`} onClick={() => setActiveNav(label)} key={label}><Icon name={icon} size={19}/><span>{label}</span>{label === 'Projects' && <em>3</em>}</button>)}
      </nav>
      <div className="sidebar-bottom">
        <button className="nav-item" onClick={() => setNotice('Helpful shortcuts: Space to preview, I for in, and O for out.')}><Icon name="help" size={19}/><span>Help & shortcuts</span></button>
        <button className="nav-item" onClick={() => setNotice('Settings are saved locally in this private workspace.')}><Icon name="settings" size={19}/><span>Settings</span></button>
        <div className="account-row"><div className="user-avatar">E</div><div><strong>Eliah</strong><small>Personal workspace</small></div><Icon name="more" size={18}/></div>
      </div>
    </aside>

    <main className="workspace">
      <header className="topbar">
        <div className="crumbs"><span>{activeNav}</span><Icon name="chevron" size={15}/><strong>{sourceFile?.name || 'Untitled clip project'}</strong><span className="save-state">{saved ? 'Saved locally' : 'Unsaved changes'}</span></div>
        <div className="top-actions">
          <button className="button button-ghost" onClick={saveProject}><Icon name="check" size={16}/>{saved ? 'Saved' : 'Save project'}</button>
          <button className="button button-dark" onClick={exportCut}><Icon name="download" size={16}/>Export cut</button>
        </div>
      </header>

      <section className="editor-layout">
        <div className="stage-column">
          <div className="project-head">
            <div>
              <div className="eyebrow">PERSONAL CLIPPING DESK</div>
              <h1>{activeClip.title}</h1>
            </div>
            <div className="head-actions">
              <button className="icon-button" aria-label="Undo" onClick={() => setNotice('Nothing to undo yet.')}><Icon name="undo" size={18}/></button>
              <button className="icon-button muted" aria-label="Redo" onClick={() => setNotice('Nothing to redo yet.')}><Icon name="redo" size={18}/></button>
              <button className="icon-button" aria-label="Fullscreen preview" onClick={() => document.querySelector('.preview-frame')?.requestFullscreen?.()}><Icon name="expand" size={18}/></button>
            </div>
          </div>

          <div className="preview-area">
            <div className={`preview-frame ${sourceUrl ? 'has-video' : ''}`} style={{ aspectRatio: aspect.value }}>
              {sourceUrl ? <video ref={videoRef} src={sourceUrl} onLoadedMetadata={onVideoMetadata} onTimeUpdate={onVideoTime} onPlay={() => setIsPlaying(true)} onPause={() => setIsPlaying(false)} className="source-video" playsInline /> : <MockPreview playhead={previewTime} />}
              <div className="preview-scrim"></div>
              <div className="preview-brand"><span className="brand-mark small"><span></span><span></span><span></span></span><span>EVERYDAY SYSTEMS</span></div>
              <div className="clip-time-chip">{formatTime(previewTime)}</div>
              {captionsOn && <div className={`caption-layer caption-${captionStyle.toLowerCase()}`}><span>{captionText || 'Add a caption in the panel'}</span></div>}
              {!sourceUrl && <button className="center-play" onClick={togglePlayback} aria-label="Preview clip"><Icon name={isPlaying ? 'pause' : 'play'} size={25}/></button>}
            </div>
            <p className="preview-hint"><Icon name="lock" size={13}/> Your files stay in this browser until you decide to export.</p>
          </div>

          <section className="timeline-section" aria-label="Clip timeline">
            <div className="timeline-toolbar">
              <div className="transport">
                <button className="transport-button" onClick={() => setPlayhead(Math.max(0, playhead - 5))} aria-label="Back 5 seconds"><Icon name="back" size={18}/></button>
                <button className="play-button" onClick={togglePlayback} aria-label={isPlaying ? 'Pause' : 'Play'}><Icon name={isPlaying ? 'pause' : 'play'} size={17}/></button>
                <button className="transport-button" onClick={() => setPlayhead(Math.min(duration, playhead + 5))} aria-label="Forward 5 seconds"><Icon name="forward" size={18}/></button>
                <span className="time-readout">{formatTime(playhead)} <i>/</i> {formatTime(duration)}</span>
              </div>
              <div className="timeline-actions"><button className="text-button" onClick={() => updateRange('start', playhead)}>Mark in <kbd>I</kbd></button><button className="text-button" onClick={() => updateRange('end', playhead)}>Mark out <kbd>O</kbd></button></div>
            </div>
            <div className="timeline-wrap">
              <div className="timeline-ruler"><span>00:00</span><span>00:15</span><span>00:30</span><span>00:45</span><span>01:00</span><span>01:15</span></div>
              <div className="filmstrip" onClick={(event) => {
                const rect = event.currentTarget.getBoundingClientRect()
                setPlayhead(Math.max(0, Math.min(duration, ((event.clientX - rect.left) / rect.width) * duration)))
              }}>
                {Array.from({ length: 24 }).map((_, index) => <div className={`frame frame-${index % 6}`} key={index}><span>{index % 4 === 0 ? '✦' : ''}</span></div>)}
                <div className="selected-range" style={{ left: `${clipPercentStart}%`, width: `${clipPercentWidth}%` }}>
                  <button className="trim-handle left" aria-label="Adjust start" onClick={(event) => event.stopPropagation()}></button>
                  <button className="trim-handle right" aria-label="Adjust end" onClick={(event) => event.stopPropagation()}></button>
                </div>
                <div className="playhead" style={{ left: `${(playhead / duration) * 100}%` }}><span></span></div>
              </div>
              <div className="clip-track"><Icon name="wave" size={14}/><span style={{ left: `${clipPercentStart}%`, width: `${clipPercentWidth}%` }} className="audio-wave">{Array.from({ length: 38 }).map((_, i) => <b key={i} style={{ height: `${16 + ((i * 17) % 55)}%` }} />)}</span></div>
            </div>
            <div className="range-controls">
              <label>IN <input aria-label="Clip start time" type="number" min="0" max={clipEnd - 0.2} step="0.1" value={clipStart.toFixed(1)} onChange={(event) => updateRange('start', event.target.value)} /><span>s</span></label>
              <label>OUT <input aria-label="Clip end time" type="number" min={clipStart + 0.2} max={duration} step="0.1" value={clipEnd.toFixed(1)} onChange={(event) => updateRange('end', event.target.value)} /><span>s</span></label>
              <div className="duration-pill"><Icon name="scissors" size={15}/>{clipLength.toFixed(1)}s highlight</div>
            </div>
          </section>
        </div>

        <aside className="inspector">
          <div className="inspector-tabs"><button className="active">Clip</button><button onClick={() => setNotice('Brand presets are part of your next export settings.')}>Brand</button></div>
          <div className="inspector-scroll">
            <section className="panel-section source-section">
              <div className="section-head"><h2>Source</h2><button className="text-button" onClick={() => fileInputRef.current?.click()}>{sourceFile ? 'Replace' : 'Upload'}</button></div>
              <input ref={fileInputRef} type="file" accept="video/*" onChange={handleUpload} hidden />
              <button className={`source-card ${sourceFile ? 'loaded' : ''}`} onClick={() => fileInputRef.current?.click()}>
                <div className="source-thumb"><Icon name={sourceFile ? 'video' : 'arrowUp'} size={20}/></div>
                <div><strong>{sourceFile?.name || 'Drop a video here'}</strong><span>{sourceFile ? `${(sourceFile.size / 1024 / 1024).toFixed(1)} MB · local file` : 'MP4, MOV or WebM'}</span></div>
                <Icon name="chevron" size={16}/>
              </button>
            </section>

            <section className="panel-section">
              <div className="section-head"><h2>Format</h2><span className="section-value">{aspect.name}</span></div>
              <div className="format-grid">{ASPECTS.map((item) => <button key={item.label} className={`format-option ${aspect.label === item.label ? 'selected' : ''}`} onClick={() => setAspect(item)}><span className={`ratio ratio-${item.label.replace(':', '-')}`}></span><b>{item.label}</b><small>{item.name}</small></button>)}</div>
            </section>

            <section className="panel-section captions-section">
              <div className="section-head"><div><h2>Captions</h2><p>Designed for sound-off viewing</p></div><button onClick={() => setCaptionsOn(!captionsOn)} className={`switch ${captionsOn ? 'on' : ''}`} role="switch" aria-checked={captionsOn}><span></span></button></div>
              {captionsOn && <>
                <textarea aria-label="Caption text" value={captionText} onChange={(event) => setCaptionText(event.target.value)} />
                <div className="style-picker">{['Pop', 'Clean', 'Subtle'].map((style) => <button key={style} className={captionStyle === style ? 'active' : ''} onClick={() => setCaptionStyle(style)}><span className={`style-sample ${style.toLowerCase()}`}>Aa</span>{style}</button>)}</div>
              </>}
            </section>

            <section className="panel-section ai-section">
              <div className="ai-icon"><Icon name="sparkles" size={16}/></div><div><strong>Find more moments</strong><p>Scan a transcript to turn key thoughts into clips.</p><button onClick={() => { addClip(); setNotice('A new suggested highlight was added to your timeline.') }}>Suggest highlights <Icon name="arrowUp" size={13}/></button></div>
            </section>
          </div>
          <div className="inspector-footer"><button className="button button-ghost full" onClick={copyLink}><Icon name="copy" size={16}/>{copyLabel}</button><button className="button button-dark full" onClick={exportCut}><Icon name="download" size={16}/>Export cut</button></div>
        </aside>
      </section>

      <section className="clip-drawer">
        <div className="drawer-heading"><div><span className="eyebrow">HIGHLIGHTS</span><h2>Your cuts <b>{clips.length}</b></h2></div><button className="button button-ghost" onClick={addClip}><Icon name="plus" size={16}/>New highlight</button></div>
        <div className="clip-list">
          {clips.map((clip, index) => <button className={`clip-card ${activeClipId === clip.id ? 'selected' : ''}`} key={clip.id} onClick={() => selectClip(clip.id)}>
            <div className={`clip-poster ${clip.color}`}><span>{index + 1}</span><div className="poster-lines"></div><i>{clip.label}</i></div>
            <div className="clip-info"><strong>{clip.title}</strong><span>{formatTime(clip.range[0])} — {formatTime(clip.range[1])}</span></div>
            {activeClipId === clip.id && <span className="selected-icon"><Icon name="check" size={13}/></span>}
          </button>)}
          <button className="add-card" onClick={addClip}><span><Icon name="plus" size={19}/></span><strong>Make a new cut</strong><small>Start at the playhead</small></button>
        </div>
      </section>
    </main>

    {isExporting && <div className="export-toast"><div className="export-top"><div className="spinner"><Icon name="scissors" size={16}/></div><div><strong>Cutting your highlight</strong><span>Keeping it private and in your browser</span></div><b>{Math.round(exportProgress)}%</b></div><div className="progress"><span style={{ width: `${exportProgress}%` }}></span></div></div>}
    {notice && <div className="notice"><Icon name="check" size={16}/><span>{notice}</span><button onClick={() => setNotice('')}><Icon name="close" size={15}/></button></div>}
  </div>
}

function MockPreview({ playhead }) {
  return <div className="mock-video" aria-label="Illustrated video preview">
    <div className="mock-grid"></div><div className="mock-orb orb-one"></div><div className="mock-orb orb-two"></div><div className="mock-card"><span>BUILD</span><strong>small<br/>systems.</strong><i>move every day</i></div><div className="mock-number">{Math.round(playhead).toString().padStart(2, '0')}</div><div className="mock-bottom-line"></div>
  </div>
}

createRoot(document.getElementById('root')).render(<App />)
