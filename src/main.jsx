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

const viralTerms = [
  ['secret', 15], ['mistake', 14], ['nobody', 13], ['no one', 13], ['truth', 11], ['stop', 10], ['never', 9], ['always', 8], ['exactly', 8], ['instead', 8], ['why', 7], ['how', 7], ['because', 6], ['before', 6], ['after', 6], ['million', 10], ['first', 6], ['best', 6], ['worst', 7], ['changed', 7], ['crazy', 9], ['believe', 6], ['watch', 6], ['listen', 6], ['imagine', 6], ['here\'s', 9], ['this is', 5]
]

function transcriptEntries(transcript, duration) {
  const stamped = [...transcript.matchAll(/(?:\[)?(\d{1,2}):(\d{2})(?:\.\d+)?(?:\])?\s*[-–—:]?\s*([^\n]+)/g)]
  if (stamped.length) return stamped.map((match, index) => ({
    start: Number(match[1]) * 60 + Number(match[2]),
    end: index < stamped.length - 1 ? Number(stamped[index + 1][1]) * 60 + Number(stamped[index + 1][2]) : duration,
    text: match[3].trim(),
  })).filter((entry) => entry.start < duration && entry.text)

  const sentences = transcript.replace(/\s+/g, ' ').match(/[^.!?]+[.!?]+|[^.!?]+$/g)?.map((sentence) => sentence.trim()).filter(Boolean) || []
  const chunkSize = Math.max(1, Math.ceil(sentences.length / 8))
  const chunks = []
  for (let index = 0; index < sentences.length; index += chunkSize) chunks.push(sentences.slice(index, index + chunkSize).join(' '))
  return chunks.map((text, index) => ({
    start: (index / Math.max(1, chunks.length)) * duration,
    end: ((index + 1) / Math.max(1, chunks.length)) * duration,
    text,
  }))
}

function localViralMoments(transcript, duration) {
  const entries = transcriptEntries(transcript, duration)
  const candidates = entries.map((entry, index) => {
    const copy = entry.text.toLowerCase()
    const termScore = viralTerms.reduce((score, [term, weight]) => score + (copy.includes(term) ? weight : 0), 0)
    const numberScore = (copy.match(/\b\d+(?:[,.]\d+)?(?:x|%|k|m)?\b/g) || []).length * 6
    const contrastScore = /(but|however|instead|actually|wrong|right|yet)/.test(copy) ? 8 : 0
    const questionScore = /\?/.test(entry.text) ? 7 : 0
    const energyScore = /!/.test(entry.text) ? 5 : 0
    const lengthScore = entry.text.length > 45 && entry.text.length < 300 ? 7 : 0
    const score = Math.min(97, 48 + termScore + numberScore + contrastScore + questionScore + energyScore + lengthScore)
    const start = Math.max(0, entry.start - Math.min(2.5, entry.start))
    const end = Math.min(duration, Math.max(start + 9, Math.min(entry.end + 5.5, start + 38)))
    return {
      id: `local-${index + 1}`,
      title: entry.text.split(/[.!?]/)[0].trim().slice(0, 52) || `High-energy moment ${index + 1}`,
      start: Number(start.toFixed(1)),
      end: Number(end.toFixed(1)),
      score,
      reason: termScore > 10 ? 'Strong curiosity or contrast hook with a clear payoff.' : questionScore ? 'Question-led opening that invites viewers to stay for the answer.' : 'A concise, standalone insight with social-friendly pacing.',
      caption: entry.text.slice(0, 130),
    }
  }).sort((a, b) => b.score - a.score)

  const selected = []
  for (const candidate of candidates) {
    const overlaps = selected.some((moment) => candidate.start < moment.end && candidate.end > moment.start)
    if (!overlaps) selected.push(candidate)
    if (selected.length === 5) break
  }
  return selected
}

function App() {
  const [activeNav, setActiveNav] = useState('Studio')
  const [clips, setClips] = useState(initialClips)
  const [activeClipId, setActiveClipId] = useState(1)
  const [duration, setDuration] = useState(82)
  const [playhead, setPlayhead] = useState(22.4)
  const [isPlaying, setIsPlaying] = useState(false)
  const [sourceFile, setSourceFile] = useState(null)
  const [sourceUrl, setSourceUrl] = useState('')
  const [sourceName, setSourceName] = useState('')
  const [sourceType, setSourceType] = useState('demo')
  const [embedUrl, setEmbedUrl] = useState('')
  const [sourceInputMode, setSourceInputMode] = useState('link')
  const [sourceLink, setSourceLink] = useState('')
  const [transcriptText, setTranscriptText] = useState('')
  const [aiMoments, setAiMoments] = useState([])
  const [analysisStatus, setAnalysisStatus] = useState('idle')
  const [analysisEngine, setAnalysisEngine] = useState('')
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
  const isExportingRef = useRef(false)

  const activeClip = clips.find((clip) => clip.id === activeClipId) || clips[0]
  const [clipStart, clipEnd] = activeClip.range
  const clipLength = Math.max(0, clipEnd - clipStart)
  const previewTime = Math.min(Math.max(playhead, clipStart), clipEnd)

  useEffect(() => {
    const savedProject = window.localStorage.getItem('cliproom-project')
    if (savedProject) setSaved(true)
    const sharedClip = new URLSearchParams(window.location.hash.slice(1)).get('clip')
    const matchingSharedClip = clips.find((clip) => String(clip.id) === String(sharedClip))
    if (matchingSharedClip) setActiveClipId(matchingSharedClip.id)
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

  function movePlayhead(rawTime) {
    const nextTime = Math.max(0, Math.min(duration, Number(rawTime)))
    setPlayhead(nextTime)
    if (videoRef.current && sourceType !== 'embed') videoRef.current.currentTime = nextTime
  }

  function selectClip(id) {
    const next = clips.find((clip) => clip.id === id)
    if (!next) return
    setActiveClipId(id)
    movePlayhead(next.range[0])
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

  function getEmbedSource(rawLink) {
    try {
      const url = new URL(rawLink)
      const host = url.hostname.replace(/^www\./, '').toLowerCase()
      let youtubeId = ''
      if (host === 'youtu.be') youtubeId = url.pathname.split('/').filter(Boolean)[0] || ''
      if (host === 'youtube.com' || host === 'm.youtube.com') {
        youtubeId = url.searchParams.get('v') || url.pathname.match(/\/(?:shorts|embed|live)\/([^/?]+)/)?.[1] || ''
      }
      if (youtubeId && /^[a-zA-Z0-9_-]{6,}$/.test(youtubeId)) {
        return { provider: 'YouTube', url: `https://www.youtube.com/embed/${youtubeId}?rel=0&modestbranding=1` }
      }
      if (host === 'vimeo.com' || host === 'player.vimeo.com') {
        const vimeoId = url.pathname.match(/(?:video\/)?(\d+)/)?.[1]
        if (vimeoId) return { provider: 'Vimeo', url: `https://player.vimeo.com/video/${vimeoId}` }
      }
      return null
    } catch {
      return null
    }
  }

  function handleLinkImport(event) {
    event.preventDefault()
    const rawLink = sourceLink.trim()
    if (!rawLink) {
      setNotice('Paste a YouTube, Vimeo, or direct video URL first.')
      return
    }
    let parsed
    try {
      parsed = new URL(rawLink)
      if (!['https:', 'http:'].includes(parsed.protocol)) throw new Error('protocol')
    } catch {
      setNotice('That does not look like a valid video link. Include https:// and try again.')
      return
    }
    const embedded = getEmbedSource(rawLink)
    if (embedded) {
      setSourceFile(null)
      setSourceUrl('')
      setSourceType('embed')
      setEmbedUrl(embedded.url)
      setSourceName(`${embedded.provider} video`)
      setNotice(`${embedded.provider} preview loaded. Use its player controls; upload a file for direct WebM exports.`)
      return
    }
    const isDirectVideo = /\.(mp4|webm|mov|m4v|ogv|ogg)(?:$|[?#])/i.test(parsed.pathname + parsed.search)
    if (!isDirectVideo) {
      setNotice('This link cannot be imported directly. Use a YouTube/Vimeo link, a direct MP4/WebM/MOV URL, or upload the video file.')
      return
    }
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current)
      objectUrlRef.current = ''
    }
    setSourceFile(null)
    setEmbedUrl('')
    setSourceType('direct')
    setSourceUrl(parsed.href)
    setSourceName(parsed.hostname.replace(/^www\./, ''))
    setNotice('Video link added. If it cannot play, download the source and use Upload instead.')
  }

  async function pasteFromClipboard() {
    try {
      const value = await navigator.clipboard.readText()
      if (!value) throw new Error('empty')
      setSourceLink(value)
      setNotice('Link pasted. Select Add link to load it.')
    } catch {
      setNotice('Paste access was blocked. Tap the field and paste the link there instead.')
    }
  }

  function handleUpload(event) {
    const file = event.target.files?.[0]
    if (!file) return
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current)
    const nextUrl = URL.createObjectURL(file)
    objectUrlRef.current = nextUrl
    setSourceFile(file)
    setSourceUrl(nextUrl)
    setEmbedUrl('')
    setSourceType('file')
    setSourceName(file.name)
    setNotice(`${file.name} is ready to clip.`)
  }

  function applyAiMoments(moments, engine) {
    const colors = ['purple', 'gold', 'mint', 'blue', 'purple']
    const nextClips = moments.map((moment, index) => ({
      id: `moment-${Date.now()}-${index}`,
      title: moment.title,
      range: [moment.start, moment.end],
      label: `${(moment.end - moment.start).toFixed(1)}s`,
      color: colors[index % colors.length],
      score: moment.score,
      reason: moment.reason,
      caption: moment.caption,
    }))
    if (!nextClips.length) {
      setNotice('No clear standalone moments were found. Try a longer transcript with timestamps.')
      return
    }
    setAiMoments(moments)
    setClips(nextClips)
    setActiveClipId(nextClips[0].id)
    setPlayhead(nextClips[0].range[0])
    if (moments[0].caption) setCaptionText(moments[0].caption)
    setAnalysisEngine(engine)
    setNotice(`${nextClips.length} high-potential moments are ready to review.`)
  }

  async function analyzeTranscript() {
    const transcript = transcriptText.trim()
    if (!transcript) {
      setNotice('Paste a transcript or captions first. Timecodes give the AI its best edit points.')
      return
    }
    setAnalysisStatus('analyzing')
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript, duration }),
      })
      if (response.ok) {
        const data = await response.json()
        if (Array.isArray(data.moments) && data.moments.length) {
          applyAiMoments(data.moments, data.engine || 'AI')
          setAnalysisStatus('done')
          return
        }
      }
      const localMoments = localViralMoments(transcript, duration)
      applyAiMoments(localMoments, 'Cliproom smart scoring')
      setAnalysisStatus('fallback')
      setNotice('Smart scoring found your moments. Add OPENAI_API_KEY in Vercel for deeper AI editorial ranking.')
    } catch {
      const localMoments = localViralMoments(transcript, duration)
      applyAiMoments(localMoments, 'Cliproom smart scoring')
      setAnalysisStatus('fallback')
      setNotice('Smart scoring is running locally because the AI service was unavailable.')
    }
  }

  function useMoment(moment, index) {
    const matchingClip = clips[index]
    if (!matchingClip) return
    selectClip(matchingClip.id)
    if (moment.caption) setCaptionText(moment.caption)
    setNotice(`Selected “${matchingClip.title}”. Adjust it, preview it, then download your cut.`)
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
    if (isExportingRef.current) return
    const video = videoRef.current
    if (!video) return
    setPlayhead(video.currentTime)
    if (video.currentTime >= clipEnd) {
      video.pause()
      video.currentTime = clipStart
      setIsPlaying(false)
    }
  }

  function onVideoError() {
    setNotice('This video link cannot play in the browser. Download the video, then use Upload instead.')
  }

  async function togglePlayback() {
    if (sourceType === 'embed') {
      setNotice('Use the controls inside the embedded player to preview this link. Upload its video file to cut and export locally.')
      return
    }
    const video = videoRef.current
    if (!video || !sourceUrl) {
      setIsPlaying((value) => !value)
      setNotice('Paste a video link or upload a file to preview this cut.')
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
      source: sourceName || sourceFile?.name || 'Demo source',
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

  async function seekVideo(video, time) {
    if (Math.abs(video.currentTime - time) < 0.05) return
    await new Promise((resolve, reject) => {
      const finish = () => { cleanup(); resolve() }
      const fail = () => { cleanup(); reject(new Error('seek failed')) }
      const cleanup = () => {
        video.removeEventListener('seeked', finish)
        video.removeEventListener('error', fail)
      }
      video.addEventListener('seeked', finish, { once: true })
      video.addEventListener('error', fail, { once: true })
      video.currentTime = time
    })
  }

  function drawClipFrame(context, canvas, video) {
    const sourceWidth = video.videoWidth || canvas.width
    const sourceHeight = video.videoHeight || canvas.height
    const sourceRatio = sourceWidth / sourceHeight
    const targetRatio = canvas.width / canvas.height
    let drawWidth = canvas.width
    let drawHeight = canvas.height
    let left = 0
    let top = 0

    if (sourceRatio > targetRatio) {
      drawWidth = canvas.height * sourceRatio
      left = (canvas.width - drawWidth) / 2
    } else {
      drawHeight = canvas.width / sourceRatio
      top = (canvas.height - drawHeight) / 2
    }

    context.fillStyle = '#121217'
    context.fillRect(0, 0, canvas.width, canvas.height)
    context.drawImage(video, left, top, drawWidth, drawHeight)

    const gradient = context.createLinearGradient(0, canvas.height * 0.55, 0, canvas.height)
    gradient.addColorStop(0, 'rgba(0,0,0,0)')
    gradient.addColorStop(1, 'rgba(0,0,0,.58)')
    context.fillStyle = gradient
    context.fillRect(0, 0, canvas.width, canvas.height)

    if (!captionsOn || !captionText.trim()) return
    const maxWidth = canvas.width * 0.82
    const fontSize = Math.max(30, Math.round(canvas.width * 0.058))
    const lineHeight = Math.round(fontSize * 1.16)
    context.font = `800 ${fontSize}px Inter, Arial, sans-serif`
    context.textAlign = 'center'
    context.textBaseline = 'middle'
    const words = captionText.trim().split(/\s+/)
    const lines = []
    let line = ''
    words.forEach((word) => {
      const test = line ? `${line} ${word}` : word
      if (context.measureText(test).width > maxWidth && line) {
        lines.push(line)
        line = word
      } else line = test
    })
    if (line) lines.push(line)
    const visibleLines = lines.slice(-3)
    const startingY = canvas.height * 0.8 - ((visibleLines.length - 1) * lineHeight) / 2
    visibleLines.forEach((text, index) => {
      const y = startingY + index * lineHeight
      if (captionStyle === 'Pop') {
        const width = context.measureText(text).width + fontSize * 0.34
        context.fillStyle = '#ffffff'
        context.fillRect(canvas.width / 2 - width / 2, y - lineHeight * 0.47, width, lineHeight * 0.94)
        context.fillStyle = '#25252b'
        context.fillText(text, canvas.width / 2, y)
      } else {
        context.lineWidth = Math.max(4, fontSize * 0.12)
        context.strokeStyle = 'rgba(0,0,0,.62)'
        context.strokeText(text, canvas.width / 2, y)
        context.fillStyle = '#ffffff'
        context.fillText(text, canvas.width / 2, y)
      }
    })
  }

  async function exportCut() {
    if (sourceType === 'embed') {
      downloadClipPlan()
      setNotice('Embedded links can play here, but browsers cannot render them into a file. Upload the video source to download a finished clip.')
      return
    }
    if (!sourceUrl || !videoRef.current) {
      downloadClipPlan()
      setNotice('Add a direct video URL or upload a source file before downloading a finished clip.')
      return
    }
    const video = videoRef.current
    const sourceStream = video.captureStream?.() || video.mozCaptureStream?.()
    if (!sourceStream || typeof MediaRecorder === 'undefined' || !HTMLCanvasElement.prototype.captureStream) {
      downloadClipPlan()
      setNotice('Your browser cannot render clips directly. Your clip plan was downloaded instead.')
      return
    }
    if (!video.videoWidth || !video.videoHeight) {
      setNotice('Wait for the video to finish loading, then try the download again.')
      return
    }

    const outputSizes = { '9:16': [720, 1280], '1:1': [1080, 1080], '16:9': [1280, 720], '4:5': [864, 1080] }
    const [width, height] = outputSizes[aspect.label] || outputSizes['9:16']
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const context = canvas.getContext('2d', { alpha: false })
    if (!context) return

    const canvasStream = canvas.captureStream(30)
    const renderedStream = new MediaStream([...canvasStream.getVideoTracks(), ...sourceStream.getAudioTracks()])
    const types = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm']
    const mimeType = types.find((type) => MediaRecorder.isTypeSupported(type))
    const chunks = []
    let recorder
    try {
      recorder = new MediaRecorder(renderedStream, mimeType ? { mimeType, videoBitsPerSecond: 5_500_000 } : undefined)
    } catch {
      downloadClipPlan()
      setNotice('Could not start the clip renderer. Your clip plan was downloaded instead.')
      return
    }

    let finished = false
    const finish = () => {
      if (finished) return
      finished = true
      cancelAnimationFrame(exporterStopRef.current)
      video.pause()
      if (recorder.state !== 'inactive') recorder.stop()
    }

    recorder.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data) }
    recorder.onerror = () => {
      isExportingRef.current = false
      setIsExporting(false)
      setNotice('The browser could not render this video. Try uploading the original video file instead.')
    }
    recorder.onstop = () => {
      isExportingRef.current = false
      const blob = new Blob(chunks, { type: mimeType || 'video/webm' })
      if (blob.size) {
        const anchor = document.createElement('a')
        anchor.href = URL.createObjectURL(blob)
        anchor.download = `${activeClip.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'clip'}.webm`
        document.body.appendChild(anchor)
        anchor.click()
        anchor.remove()
        window.setTimeout(() => URL.revokeObjectURL(anchor.href), 2000)
      }
      setIsExporting(false)
      setExportProgress(100)
      setNotice('Your finished clip is downloading as a WebM, with the selected crop and captions baked in.')
    }

    try {
      isExportingRef.current = true
      setIsExporting(true)
      setExportProgress(0)
      video.pause()
      await seekVideo(video, clipStart)
      drawClipFrame(context, canvas, video)
      recorder.start(250)
      await video.play()
      const render = () => {
        drawClipFrame(context, canvas, video)
        const progress = Math.min(99, Math.max(0, ((video.currentTime - clipStart) / clipLength) * 100))
        setExportProgress(progress)
        if (video.currentTime >= clipEnd - 0.03 || video.ended) finish()
        else exporterStopRef.current = requestAnimationFrame(render)
      }
      exporterStopRef.current = requestAnimationFrame(render)
    } catch {
      isExportingRef.current = false
      setIsExporting(false)
      if (recorder.state !== 'inactive') recorder.stop()
      setNotice('Could not render this source. For the most reliable download, use an uploaded MP4 or WebM file.')
    }
  }

  async function copyLink() {
    const link = `${window.location.origin}${window.location.pathname}#clip=${activeClip.id}`
    try {
      await navigator.clipboard.writeText(link)
      setCopyLabel('Copied!')
      setNotice('A working Cliproom link is on your clipboard.')
    } catch {
      window.prompt('Copy this Cliproom link:', link)
      setCopyLabel('Link ready')
    }
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
        <div className="crumbs"><span>{activeNav}</span><Icon name="chevron" size={15}/><strong>{sourceName || sourceFile?.name || 'Untitled clip project'}</strong><span className="save-state">{saved ? 'Saved locally' : 'Unsaved changes'}</span></div>
        <div className="top-actions">
          <button className="button button-ghost" onClick={saveProject}><Icon name="check" size={16}/>{saved ? 'Saved' : 'Save project'}</button>
          <button className="button button-dark" onClick={exportCut}><Icon name="download" size={16}/>Download clip</button>
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
            <div className={`preview-frame ${sourceUrl || sourceType === 'embed' ? 'has-video' : ''}`} style={{ aspectRatio: aspect.value }}>
              {sourceType === 'embed' ? <iframe className="source-video embedded-video" src={embedUrl} title={sourceName || 'Linked video preview'} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen /> : sourceUrl ? <video ref={videoRef} src={sourceUrl} onLoadedMetadata={onVideoMetadata} onTimeUpdate={onVideoTime} onError={onVideoError} onPlay={() => setIsPlaying(true)} onPause={() => setIsPlaying(false)} className="source-video" crossOrigin={sourceType === 'direct' ? 'anonymous' : undefined} playsInline controls /> : <MockPreview playhead={previewTime} />}
              <div className="preview-scrim"></div>
              <div className="preview-brand"><span className="brand-mark small"><span></span><span></span><span></span></span><span>EVERYDAY SYSTEMS</span></div>
              <div className="clip-time-chip">{formatTime(previewTime)}</div>
              {captionsOn && <div className={`caption-layer caption-${captionStyle.toLowerCase()}`}><span>{captionText || 'Add a caption in the panel'}</span></div>}
              {!sourceUrl && sourceType !== 'embed' && <button className="center-play" onClick={togglePlayback} aria-label="Preview clip"><Icon name={isPlaying ? 'pause' : 'play'} size={25}/></button>}
            </div>
            <p className="preview-hint"><Icon name="lock" size={13}/> Your files stay in this browser until you decide to export.</p>
          </div>

          <section className="timeline-section" aria-label="Clip timeline">
            <div className="timeline-toolbar">
              <div className="transport">
                <button className="transport-button" onClick={() => movePlayhead(Math.max(0, playhead - 5))} aria-label="Back 5 seconds"><Icon name="back" size={18}/></button>
                <button className="play-button" onClick={togglePlayback} aria-label={isPlaying ? 'Pause' : 'Play'}><Icon name={isPlaying ? 'pause' : 'play'} size={17}/></button>
                <button className="transport-button" onClick={() => movePlayhead(Math.min(duration, playhead + 5))} aria-label="Forward 5 seconds"><Icon name="forward" size={18}/></button>
                <span className="time-readout">{formatTime(playhead)} <i>/</i> {formatTime(duration)}</span>
              </div>
              <div className="timeline-actions"><button className="text-button" onClick={() => updateRange('start', playhead)}>Mark in <kbd>I</kbd></button><button className="text-button" onClick={() => updateRange('end', playhead)}>Mark out <kbd>O</kbd></button></div>
            </div>
            <div className="timeline-wrap">
              <div className="timeline-ruler"><span>00:00</span><span>00:15</span><span>00:30</span><span>00:45</span><span>01:00</span><span>01:15</span></div>
              <div className="filmstrip" onClick={(event) => {
                const rect = event.currentTarget.getBoundingClientRect()
                movePlayhead(Math.max(0, Math.min(duration, ((event.clientX - rect.left) / rect.width) * duration)))
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
              <div className="section-head"><div><h2>Add a source</h2><p>Paste a link or upload a file</p></div></div>
              <div className="source-mode-toggle" role="tablist" aria-label="Source type">
                <button className={sourceInputMode === 'link' ? 'active' : ''} onClick={() => setSourceInputMode('link')} role="tab" aria-selected={sourceInputMode === 'link'}><Icon name="copy" size={13}/>Paste link</button>
                <button className={sourceInputMode === 'upload' ? 'active' : ''} onClick={() => setSourceInputMode('upload')} role="tab" aria-selected={sourceInputMode === 'upload'}><Icon name="arrowUp" size={13}/>Upload</button>
              </div>
              <input ref={fileInputRef} type="file" accept="video/*" onChange={handleUpload} hidden />
              {sourceInputMode === 'link' ? <form className="link-import" onSubmit={handleLinkImport}>
                <label htmlFor="video-link">Video link</label>
                <div className="link-input-row"><input id="video-link" type="url" value={sourceLink} onChange={(event) => setSourceLink(event.target.value)} placeholder="Paste YouTube, Vimeo, or video URL" autoComplete="url" /><button type="button" className="paste-button" onClick={pasteFromClipboard}>Paste</button></div>
                <button className="button button-dark link-submit" type="submit"><Icon name="arrowUp" size={15}/>Add link</button>
                <p className="link-help">YouTube and Vimeo open in the preview. Direct MP4, MOV, and WebM links can be clipped here.</p>
              </form> : <button className={`source-card ${sourceFile ? 'loaded' : ''}`} onClick={() => fileInputRef.current?.click()}>
                <div className="source-thumb"><Icon name={sourceFile ? 'video' : 'arrowUp'} size={20}/></div>
                <div><strong>{sourceFile?.name || 'Choose a video file'}</strong><span>{sourceFile ? `${(sourceFile.size / 1024 / 1024).toFixed(1)} MB · local file` : 'MP4, MOV or WebM'}</span></div>
                <Icon name="chevron" size={16}/>
              </button>}
              {sourceName && <div className="linked-source"><Icon name="check" size={14}/><span><b>Ready:</b> {sourceName}</span><button type="button" onClick={() => setSourceInputMode(sourceFile ? 'upload' : 'link')}>Change</button></div>}
            </section>

            <section className="panel-section ai-highlights-section">
              <div className="section-head"><div><h2><span className="ai-title-icon"><Icon name="sparkles" size={14}/></span>AI viral moments</h2><p>{analysisStatus === 'analyzing' ? 'Reading hooks, emotion, and payoff…' : 'Find the lines people will want to share'}</p></div><span className={`ai-status ${analysisStatus}`}>{analysisStatus === 'analyzing' ? 'Analyzing' : analysisEngine || 'Ready'}</span></div>
              <label className="transcript-label" htmlFor="transcript">Transcript or captions</label>
              <textarea id="transcript" className="transcript-input" value={transcriptText} onChange={(event) => setTranscriptText(event.target.value)} placeholder={'Paste captions here. Timecodes work best:\n00:12 The mistake almost everyone makes is…\n00:22 Here is what changed everything…'} />
              <button className="button button-ai full" onClick={analyzeTranscript} disabled={analysisStatus === 'analyzing'}>{analysisStatus === 'analyzing' ? <><span className="tiny-spinner"></span>Finding moments</> : <><Icon name="sparkles" size={15}/>Find viral moments</>}</button>
              <p className="ai-note">Scores hooks, tension, specificity, emotion, and standalone payoff. Use captions or a transcript for precise cuts.</p>
              {aiMoments.length > 0 && <div className="ai-results">{aiMoments.slice(0, 3).map((moment, index) => <button className="ai-result" onClick={() => useMoment(moment, index)} key={moment.id || index}><span className="ai-score">{moment.score}</span><span className="ai-result-copy"><b>{moment.title}</b><small>{formatTime(moment.start)} — {formatTime(moment.end)} · {moment.reason}</small></span><Icon name="chevron" size={15}/></button>)}</div>}
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
          <div className="inspector-footer"><button className="button button-ghost full" onClick={copyLink}><Icon name="copy" size={16}/>{copyLabel}</button><button className="button button-dark full" onClick={exportCut}><Icon name="download" size={16}/>Download clip</button></div>
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
