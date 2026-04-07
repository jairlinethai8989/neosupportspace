/**
 * NeoSupport Shared Database Types
 * These types match the schema defined in supabase/migrations/001_init.sql
 */

export type TicketStatus = 'open' | 'assigned' | 'pending_customer' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';
export type SenderType = 'customer' | 'agent' | 'system';

export interface Hospital {
  id: string;
  code: string;
  name: string;
  address?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CustomerUser {
  id: string;
  line_user_id: string;
  display_name?: string;
  full_name?: string;
  phone?: string;
  department?: string;
  hospital_id: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface AgentUser {
  id: string;
  auth_user_id: string;
  email: string;
  display_name: string;
  role: 'agent' | 'admin';
  avatar_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Ticket {
  id: string;
  ticket_number: number;
  title: string;
  category: string;
  priority: TicketPriority;
  status: TicketStatus;
  hospital_id: string;
  customer_id: string;
  assigned_agent_id?: string | null;
  last_message_at: string;
  first_response_at?: string | null;
  resolved_at?: string | null;
  closed_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface TicketMessage {
  id: string;
  ticket_id: string;
  sender_id: string;
  sender_type: SenderType;
  message_body: string;
  metadata: Record<string, any>;
  created_at: string;
}

export interface TicketEvent {
  id: string;
  ticket_id: string;
  event_type: string;
  actor_id?: string;
  actor_type: SenderType;
  old_value?: any;
  new_value?: any;
  created_at: string;
}
