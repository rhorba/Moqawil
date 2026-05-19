import { ClientForm } from '../client-form'

export default function NewClientPage() {
  return (
    <div className="p-6 max-w-xl">
      <h1 className="text-2xl font-bold mb-6">Nouveau client</h1>
      <ClientForm />
    </div>
  )
}
