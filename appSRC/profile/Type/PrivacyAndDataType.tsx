export const PRIVACY_OPTIONS = [
  {
    id: "1",
    label: "Nombre y Apellido",
    key: "legalName",
    editable: false,
    icon: "person-outline",
    description: "Nombre visible para otros usuarios",
  },
  {
    id: "2",
    label: "Número de Teléfono",
    key: "phoneNumber",
    editable: true,
    icon: "call-outline",
    description: "Tu contacto verificado",
  },
  {
    id: "3",
    label: "Correo Electrónico",
    key: "email",
    editable: false,
    icon: "mail-outline",
    description: "Identificador principal de la cuenta",
  },
  {
    id: "4",
    label: "Rol de Usuario",
    key: "role",
    editable: false,
    icon: "briefcase-outline",
    description: "Tipo de cuenta (Cliente o Profesional)",
  },
];
