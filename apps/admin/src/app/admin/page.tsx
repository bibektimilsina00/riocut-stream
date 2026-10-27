import { redirect } from 'next/navigation';

export default function AdminPage() {
    // Redirect to dashboard since that's the new admin home
    redirect('/admin/dashboard');
}
