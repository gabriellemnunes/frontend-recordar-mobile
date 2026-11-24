function createApi(baseUrl, token, onUnauthorized = () => {}, fetcher = fetch) {
  return async function api(path, { method = "GET", body } = {}) {
    if (!/^https?:\/\//.test(baseUrl || ""))
      throw new Error("Configure o endereço da API no arquivo .env.");
    const controller = new AbortController();
    const timer = setTimeout(
      () => controller.abort(),
      path === "/chat" ? 95000 : 20000,
    );
    try {
      const response = await fetcher(baseUrl.replace(/\/$/, "") + path, {
        method,
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      });
      let data;
      try {
        data = await response.json();
      } catch (error) {
        if (error.name === "AbortError" || controller.signal.aborted) throw error;
        if (response.ok) throw new Error("O servidor enviou uma resposta inválida. Tente novamente.");
        data = {};
      }
      if (response.status === 401 && token) await onUnauthorized();
      if (!response.ok)
        throw Object.assign(
          new Error(
            data.message || "Não foi possível concluir. Tente novamente.",
          ),
          { status: response.status },
        );
      return data;
    } catch (error) {
      if (error.name === "AbortError" || controller.signal.aborted)
        throw new Error(
          "O servidor demorou para responder. Confira sua conexão.",
        );
      if (
        error instanceof TypeError ||
        /^(fetch failed|network request failed)$/i.test(error.message || "")
      )
        throw new Error(
          "Não foi possível conectar ao servidor. Confira sua conexão e tente novamente.",
        );
      throw error;
    } finally {
      clearTimeout(timer);
    }
  };
}
function availablePath({
  triageId,
  appointmentId,
  doctorId,
  clinicId,
  specialtyId,
  date,
} = {}) {
  const entries = Object.entries({
    id_pre_triagem: triageId,
    id_consulta_atual: appointmentId,
    medico: doctorId,
    clinica: clinicId,
    especialidade: specialtyId,
    data: date,
  }).filter(([, v]) => v);
  return (
    "/consultas/disponiveis" +
    (entries.length
      ? "?" + entries.map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join("&")
      : "")
  );
}
module.exports = { createApi, availablePath };
