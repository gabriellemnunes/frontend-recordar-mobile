function createApi(baseUrl, token, onUnauthorized = () => {}, fetcher = fetch) {
  if (!/^https?:\/\//.test(baseUrl || '')) throw new Error('Configure o endereço da API no arquivo .env.');
  return async function api(path, { method = 'GET', body } = {}) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20000);
    try {
      const response = await fetcher(baseUrl.replace(/\/$/, '') + path, {
        method, signal: controller.signal,
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        ...(body === undefined ? {} : { body: JSON.stringify(body) })
      });
      const data = await response.json().catch(() => ({}));
      if (response.status === 401 && token) await onUnauthorized();
      if (!response.ok) throw Object.assign(new Error(data.message || 'Não foi possível concluir. Tente novamente.'), { status: response.status });
      return data;
    } catch (error) {
      if (error.name === 'AbortError') throw new Error('O servidor demorou para responder. Confira sua conexão.');
      throw error;
    } finally { clearTimeout(timer); }
  };
}
function availablePath({ triageId, doctorId, clinicId, specialtyId, date } = {}) {
  const entries = Object.entries({ id_pre_triagem: triageId, medico: doctorId, clinica: clinicId, especialidade: specialtyId, data: date }).filter(([, v]) => v);
  return '/consultas/disponiveis' + (entries.length ? '?' + entries.map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&') : '');
}
module.exports = { createApi, availablePath };
