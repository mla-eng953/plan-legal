// The query grammar matches SocialInvite.swift. Copying never discards a room UUID.
function parseInvitation(search, hash = '') {
  if (hash || new TextEncoder().encode(search).length > 2048) return null;
  // URLSearchParams otherwise ignores empty pairs and treats '+' as a space, unlike native URL queries.
  const query = search.startsWith('?') ? search.slice(1) : search;
  if (!query || query.includes('+') || query.split('&').some(pair => !pair)) return null;
  const params = new URLSearchParams(search);
  const keys = [...params.keys()];
  if (new Set(keys).size !== keys.length || keys.some(k => !['kind', 'code', 'room'].includes(k))) return null;
  const kind = params.get('kind');
  const code = (params.get('code') || '').trim().toUpperCase();
  const room = params.get('room');
  if (!['group', 'room', 'challenge'].includes(kind) || !/^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{8}$/.test(code)) return null;
  if (kind === 'room' ? !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(room || '') : params.has('room')) return null;
  const link = new URL('https://plan-workouts.netlify.app/invite/');
  link.searchParams.set('kind', kind);
  link.searchParams.set('code', code);
  if (kind === 'room') link.searchParams.set('room', room.toUpperCase());
  const host = kind === 'group' ? 'join' : kind;
  return {kind, code, link: link.href, url: `plan://${host}/${code}${kind === 'room' ? '/' + room : ''}`};
}

const invitation = new TextEncoder().encode(location.href).length <= 2048
  ? parseInvitation(location.search, location.href.includes('#') ? '#' : '') : null;
if (invitation) {
  document.getElementById('title').textContent = invitation.kind === 'challenge' ? 'A challenge for you' : invitation.kind === 'room' ? 'Your workout room awaits' : 'Train with your friends';
  const open = document.getElementById('open');
  open.href = invitation.url;
  open.hidden = false;
  document.getElementById('details').hidden = false;
  document.getElementById('code').textContent = invitation.code;
  document.getElementById('full-link').value = invitation.link;
  document.getElementById('instructions').textContent = invitation.kind === 'challenge'
    ? 'You can also enter this code in Friends → Challenges → Join with code.'
    : invitation.kind === 'room'
      ? 'Reopen or paste the full link to review this exact room. The code alone joins its group, not this room.'
      : 'You can also enter this code in Friends → Groups → Join with code.';
  document.getElementById('copy').addEventListener('click', async () => {
    const status = document.getElementById('copy-status');
    try {
      await navigator.clipboard.writeText(invitation.link);
      status.textContent = 'Invitation link copied. After installing a supported beta, return here or explicitly paste it in PLAN.';
    } catch {
      status.textContent = 'Copy was unavailable. Select the full invitation link on this page and copy it manually, or return to the original message.';
    }
  });
} else {
  document.getElementById('error').hidden = false;
}
