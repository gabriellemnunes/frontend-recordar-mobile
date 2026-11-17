function openBooking(navigation, triageId) {
  navigation.navigate("Recordar", {
    screen: "Agendamento",
    params: { id_pre_triagem: triageId || undefined },
  });
}
module.exports = { openBooking };
