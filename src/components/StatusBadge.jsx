const STATUS_CONFIG = {
    ABERTO: { label: 'Aberto', color: 'bg-blue-100 text-blue-800' },
    EM_ATENDIMENTO: { label: 'Em Atendimento', color: 'bg-yellow-100 text-yellow-800' },
    AGUARDANDO_CLIENTE: { label: 'Aguardando Cliente', color: 'bg-orange-100 text-orange-800' },
    RESOLVIDO: { label: 'Resolvido', color: 'bg-green-100 text-green-800' },
    FECHADO: { label: 'Fechado', color: 'bg-gray-100 text-gray-600' },
}

export function StatusBadge({ status }) {
    const config = STATUS_CONFIG[status] ?? { label: status, color: 'bg-gray-100 text-gray-600' }
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
            {config.label}
        </span>
    )
}