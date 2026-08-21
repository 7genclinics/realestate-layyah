export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      agent_commissions: {
        Row: {
          agent_id: string
          commission_amount: number
          created_at: string
          id: string
          notes: string | null
          sale_id: string
          status: string
        }
        Insert: {
          agent_id: string
          commission_amount: number
          created_at?: string
          id?: string
          notes?: string | null
          sale_id: string
          status?: string
        }
        Update: {
          agent_id?: string
          commission_amount?: number
          created_at?: string
          id?: string
          notes?: string | null
          sale_id?: string
          status?: string
        }
        Relationships: []
      }
      agent_payouts: {
        Row: {
          agent_id: string
          amount: number
          cash_account_id: string
          commission_id: string | null
          created_at: string
          id: string
          notes: string | null
          payment_mode: string
          payout_date: string
          reference_no: string | null
        }
        Insert: {
          agent_id: string
          amount: number
          cash_account_id: string
          commission_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          payment_mode?: string
          payout_date?: string
          reference_no?: string | null
        }
        Update: {
          agent_id?: string
          amount?: number
          cash_account_id?: string
          commission_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          payment_mode?: string
          payout_date?: string
          reference_no?: string | null
        }
        Relationships: []
      }
      agents: {
        Row: {
          agency_name: string | null
          agent_type: string
          commission_rate: number | null
          created_at: string
          email: string | null
          id: string
          name: string
          phone: string
          status: string
          updated_at: string
        }
        Insert: {
          agency_name?: string | null
          agent_type?: string
          commission_rate?: number | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          phone: string
          status?: string
          updated_at?: string
        }
        Update: {
          agency_name?: string | null
          agent_type?: string
          commission_rate?: number | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      development_expenses: {
        Row: {
          amount: number
          cash_account_id: string | null
          contract_id: string | null
          created_at: string
          description: string
          expense_date: string
          id: string
          party_id: string | null
          project_id: string
          receipt_proof: string | null
        }
        Insert: {
          amount: number
          cash_account_id?: string | null
          contract_id?: string | null
          created_at?: string
          description: string
          expense_date?: string
          id?: string
          party_id?: string | null
          project_id: string
          receipt_proof?: string | null
        }
        Update: {
          amount?: number
          cash_account_id?: string | null
          contract_id?: string | null
          created_at?: string
          description?: string
          expense_date?: string
          id?: string
          party_id?: string | null
          project_id?: string
          receipt_proof?: string | null
        }
        Relationships: []
      }
      development_projects: {
        Row: {
          budget: number
          category: string
          created_at: string
          description: string | null
          id: string
          name: string
          society_id: string
          status: string
          updated_at: string
        }
        Insert: {
          budget?: number
          category: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          society_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          budget?: number
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          society_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      payroll_records: {
        Row: {
          advance_deduction: number | null
          basic_salary: number
          bonus: number | null
          cash_account_id: string | null
          created_at: string
          id: string
          net_salary: number
          other_deduction: number | null
          paid_at: string | null
          payment_status: string
          period_month: string
          staff_id: string
        }
        Insert: {
          advance_deduction?: number | null
          basic_salary: number
          bonus?: number | null
          cash_account_id?: string | null
          created_at?: string
          id?: string
          net_salary: number
          other_deduction?: number | null
          paid_at?: string | null
          payment_status?: string
          period_month: string
          staff_id: string
        }
        Update: {
          advance_deduction?: number | null
          basic_salary?: number
          bonus?: number | null
          cash_account_id?: string | null
          created_at?: string
          id?: string
          net_salary?: number
          other_deduction?: number | null
          paid_at?: string | null
          payment_status?: string
          period_month?: string
          staff_id?: string
        }
        Relationships: []
      }
      salary_advances: {
        Row: {
          amount: number
          cash_account_id: string | null
          created_at: string
          id: string
          issue_date: string
          notes: string | null
          repaid_amount: number | null
          staff_id: string
          status: string
        }
        Insert: {
          amount: number
          cash_account_id?: string | null
          created_at?: string
          id?: string
          issue_date?: string
          notes?: string | null
          repaid_amount?: number | null
          staff_id: string
          status?: string
        }
        Update: {
          amount?: number
          cash_account_id?: string | null
          created_at?: string
          id?: string
          issue_date?: string
          notes?: string | null
          repaid_amount?: number | null
          staff_id?: string
          status?: string
        }
        Relationships: []
      }
      staff_members: {
        Row: {
          basic_salary: number
          cnic: string | null
          created_at: string
          department: string
          designation: string
          full_name: string
          id: string
          joining_date: string
          phone: string
          status: string
          updated_at: string
        }
        Insert: {
          basic_salary?: number
          cnic?: string | null
          created_at?: string
          department?: string
          designation: string
          full_name: string
          id?: string
          joining_date?: string
          phone: string
          status?: string
          updated_at?: string
        }
        Update: {
          basic_salary?: number
          cnic?: string | null
          created_at?: string
          department?: string
          designation?: string
          full_name?: string
          id?: string
          joining_date?: string
          phone?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          id: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      cash_accounts: {
        Row: {
          account_type: Database["public"]["Enums"]["cash_account_type"]
          code: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          notes: string | null
          opening_balance: number
          society_id: string | null
          updated_at: string
        }
        Insert: {
          account_type: Database["public"]["Enums"]["cash_account_type"]
          code?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          notes?: string | null
          opening_balance?: number
          society_id?: string | null
          updated_at?: string
        }
        Update: {
          account_type?: Database["public"]["Enums"]["cash_account_type"]
          code?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          notes?: string | null
          opening_balance?: number
          society_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cash_accounts_society_id_fkey"
            columns: ["society_id"]
            isOneToOne: false
            referencedRelation: "societies"
            referencedColumns: ["id"]
          },
        ]
      }
      cash_categories: {
        Row: {
          category_type: Database["public"]["Enums"]["cash_category_type"]
          created_at: string
          group_name: string | null
          id: string
          is_active: boolean
          name: string
        }
        Insert: {
          category_type: Database["public"]["Enums"]["cash_category_type"]
          created_at?: string
          group_name?: string | null
          id?: string
          is_active?: boolean
          name: string
        }
        Update: {
          category_type?: Database["public"]["Enums"]["cash_category_type"]
          created_at?: string
          group_name?: string | null
          id?: string
          is_active?: boolean
          name?: string
        }
        Relationships: []
      }
      cash_transactions: {
        Row: {
          amount: number
          cash_account_id: string
          category_id: string | null
          code: string
          contract_id: string | null
          contract_payment_id: string | null
          counterparty_name: string | null
          created_at: string
          description: string
          entered_by: string | null
          id: string
          land_exchange_id: string | null
          land_parcel_id: string | null
          land_payment_id: string | null
          notes: string | null
          party_id: string | null
          payment_mode: Database["public"]["Enums"]["payment_mode"] | null
          receipt_id: string | null
          reference_no: string | null
          society_id: string | null
          status: Database["public"]["Enums"]["cash_transaction_status"]
          transaction_date: string
          transaction_type: Database["public"]["Enums"]["cash_transaction_type"]
          transfer_group_id: string | null
          transfer_side:
            | Database["public"]["Enums"]["cash_transfer_side"]
            | null
          updated_at: string
        }
        Insert: {
          amount: number
          cash_account_id: string
          category_id?: string | null
          code?: string
          contract_id?: string | null
          contract_payment_id?: string | null
          counterparty_name?: string | null
          created_at?: string
          description?: string
          entered_by?: string | null
          id?: string
          land_exchange_id?: string | null
          land_parcel_id?: string | null
          land_payment_id?: string | null
          notes?: string | null
          party_id?: string | null
          payment_mode?: Database["public"]["Enums"]["payment_mode"] | null
          receipt_id?: string | null
          reference_no?: string | null
          society_id?: string | null
          status?: Database["public"]["Enums"]["cash_transaction_status"]
          transaction_date?: string
          transaction_type: Database["public"]["Enums"]["cash_transaction_type"]
          transfer_group_id?: string | null
          transfer_side?:
            | Database["public"]["Enums"]["cash_transfer_side"]
            | null
          updated_at?: string
        }
        Update: {
          amount?: number
          cash_account_id?: string
          category_id?: string | null
          code?: string
          contract_id?: string | null
          contract_payment_id?: string | null
          counterparty_name?: string | null
          created_at?: string
          description?: string
          entered_by?: string | null
          id?: string
          land_exchange_id?: string | null
          land_parcel_id?: string | null
          land_payment_id?: string | null
          notes?: string | null
          party_id?: string | null
          payment_mode?: Database["public"]["Enums"]["payment_mode"] | null
          receipt_id?: string | null
          reference_no?: string | null
          society_id?: string | null
          status?: Database["public"]["Enums"]["cash_transaction_status"]
          transaction_date?: string
          transaction_type?: Database["public"]["Enums"]["cash_transaction_type"]
          transfer_group_id?: string | null
          transfer_side?:
            | Database["public"]["Enums"]["cash_transfer_side"]
            | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cash_transactions_cash_account_id_fkey"
            columns: ["cash_account_id"]
            isOneToOne: false
            referencedRelation: "cash_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "cash_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_transactions_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_transactions_contract_payment_id_fkey"
            columns: ["contract_payment_id"]
            isOneToOne: true
            referencedRelation: "contract_payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_transactions_entered_by_fkey"
            columns: ["entered_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_transactions_land_exchange_id_fkey"
            columns: ["land_exchange_id"]
            isOneToOne: false
            referencedRelation: "land_exchanges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_transactions_land_parcel_id_fkey"
            columns: ["land_parcel_id"]
            isOneToOne: false
            referencedRelation: "land_parcels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_transactions_land_payment_id_fkey"
            columns: ["land_payment_id"]
            isOneToOne: false
            referencedRelation: "land_payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_transactions_party_id_fkey"
            columns: ["party_id"]
            isOneToOne: false
            referencedRelation: "parties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_transactions_receipt_id_fkey"
            columns: ["receipt_id"]
            isOneToOne: true
            referencedRelation: "receipts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_transactions_society_id_fkey"
            columns: ["society_id"]
            isOneToOne: false
            referencedRelation: "societies"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_payments: {
        Row: {
          amount: number
          cash_account_id: string
          code: string
          contract_id: string
          created_at: string
          entered_by: string | null
          id: string
          notes: string | null
          party_id: string
          payment_date: string
          payment_mode: Database["public"]["Enums"]["payment_mode"]
          reference_no: string | null
        }
        Insert: {
          amount: number
          cash_account_id: string
          code?: string
          contract_id: string
          created_at?: string
          entered_by?: string | null
          id?: string
          notes?: string | null
          party_id: string
          payment_date?: string
          payment_mode?: Database["public"]["Enums"]["payment_mode"]
          reference_no?: string | null
        }
        Update: {
          amount?: number
          cash_account_id?: string
          code?: string
          contract_id?: string
          created_at?: string
          entered_by?: string | null
          id?: string
          notes?: string | null
          party_id?: string
          payment_date?: string
          payment_mode?: Database["public"]["Enums"]["payment_mode"]
          reference_no?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contract_payments_cash_account_id_fkey"
            columns: ["cash_account_id"]
            isOneToOne: false
            referencedRelation: "cash_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_payments_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_payments_entered_by_fkey"
            columns: ["entered_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_payments_party_id_fkey"
            columns: ["party_id"]
            isOneToOne: false
            referencedRelation: "parties"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          code: string
          contract_type: Database["public"]["Enums"]["contract_type"]
          contract_value: number
          created_at: string
          created_by: string | null
          end_date: string | null
          id: string
          notes: string | null
          paid_amount: number
          party_id: string
          quantity: number
          rate: number
          remaining_amount: number
          retention_amount: number
          society_id: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["contract_status"]
          title: string
          unit: Database["public"]["Enums"]["contract_unit"]
          updated_at: string
        }
        Insert: {
          code?: string
          contract_type?: Database["public"]["Enums"]["contract_type"]
          contract_value: number
          created_at?: string
          created_by?: string | null
          end_date?: string | null
          id?: string
          notes?: string | null
          paid_amount?: number
          party_id: string
          quantity?: number
          rate?: number
          remaining_amount?: number
          retention_amount?: number
          society_id?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["contract_status"]
          title: string
          unit?: Database["public"]["Enums"]["contract_unit"]
          updated_at?: string
        }
        Update: {
          code?: string
          contract_type?: Database["public"]["Enums"]["contract_type"]
          contract_value?: number
          created_at?: string
          created_by?: string | null
          end_date?: string | null
          id?: string
          notes?: string | null
          paid_amount?: number
          party_id?: string
          quantity?: number
          rate?: number
          remaining_amount?: number
          retention_amount?: number
          society_id?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["contract_status"]
          title?: string
          unit?: Database["public"]["Enums"]["contract_unit"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contracts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_party_id_fkey"
            columns: ["party_id"]
            isOneToOne: false
            referencedRelation: "parties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_society_id_fkey"
            columns: ["society_id"]
            isOneToOne: false
            referencedRelation: "societies"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          address: string | null
          assigned_to: string | null
          caste: string | null
          code: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          full_name: string
          guardian_name: string | null
          id: string
          id_number: string | null
          id_type: Database["public"]["Enums"]["id_document_type"]
          notes: string | null
          phone: string
          phone_secondary: string | null
          relation: Database["public"]["Enums"]["customer_relation"]
          source: Database["public"]["Enums"]["customer_source"]
          stage: Database["public"]["Enums"]["customer_stage"]
          updated_at: string
        }
        Insert: {
          address?: string | null
          assigned_to?: string | null
          caste?: string | null
          code?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          full_name: string
          guardian_name?: string | null
          id?: string
          id_number?: string | null
          id_type?: Database["public"]["Enums"]["id_document_type"]
          notes?: string | null
          phone: string
          phone_secondary?: string | null
          relation?: Database["public"]["Enums"]["customer_relation"]
          source?: Database["public"]["Enums"]["customer_source"]
          stage?: Database["public"]["Enums"]["customer_stage"]
          updated_at?: string
        }
        Update: {
          address?: string | null
          assigned_to?: string | null
          caste?: string | null
          code?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          full_name?: string
          guardian_name?: string | null
          id?: string
          id_number?: string | null
          id_type?: Database["public"]["Enums"]["id_document_type"]
          notes?: string | null
          phone?: string
          phone_secondary?: string | null
          relation?: Database["public"]["Enums"]["customer_relation"]
          source?: Database["public"]["Enums"]["customer_source"]
          stage?: Database["public"]["Enums"]["customer_stage"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customers_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customers_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          code: string
          created_at: string
          description: string | null
          document_date: string
          document_type: Database["public"]["Enums"]["document_type"]
          entity_id: string
          entity_type: Database["public"]["Enums"]["document_entity"]
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          is_confidential: boolean
          mime_type: string | null
          replaces_id: string | null
          status: Database["public"]["Enums"]["document_status"]
          title: string
          updated_at: string
          uploaded_by: string | null
          version: number
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          code?: string
          created_at?: string
          description?: string | null
          document_date?: string
          document_type?: Database["public"]["Enums"]["document_type"]
          entity_id: string
          entity_type: Database["public"]["Enums"]["document_entity"]
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          is_confidential?: boolean
          mime_type?: string | null
          replaces_id?: string | null
          status?: Database["public"]["Enums"]["document_status"]
          title: string
          updated_at?: string
          uploaded_by?: string | null
          version?: number
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          code?: string
          created_at?: string
          description?: string | null
          document_date?: string
          document_type?: Database["public"]["Enums"]["document_type"]
          entity_id?: string
          entity_type?: Database["public"]["Enums"]["document_entity"]
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          is_confidential?: boolean
          mime_type?: string | null
          replaces_id?: string | null
          status?: Database["public"]["Enums"]["document_status"]
          title?: string
          updated_at?: string
          uploaded_by?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "documents_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_replaces_id_fkey"
            columns: ["replaces_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      installments: {
        Row: {
          created_at: string
          due_date: string
          id: string
          installment_no: number
          notes: string | null
          period_label: string
          received_amount: number
          received_date: string | null
          sale_id: string
          scheduled_amount: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          due_date: string
          id?: string
          installment_no: number
          notes?: string | null
          period_label: string
          received_amount?: number
          received_date?: string | null
          sale_id: string
          scheduled_amount: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          due_date?: string
          id?: string
          installment_no?: number
          notes?: string | null
          period_label?: string
          received_amount?: number
          received_date?: string | null
          sale_id?: string
          scheduled_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "installments_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      land_exchanges: {
        Row: {
          agreement_terms: string | null
          approved_at: string | null
          approved_by: string | null
          code: string
          completed_at: string | null
          created_at: string
          created_by: string | null
          difference_amount: number
          id: string
          incoming_area: number
          incoming_area_unit: Database["public"]["Enums"]["area_unit"]
          incoming_description: string | null
          incoming_khasra: string | null
          incoming_khata: string | null
          incoming_khewat: string | null
          incoming_land_id: string | null
          incoming_location: string | null
          incoming_mouza: string | null
          incoming_title: string
          incoming_value: number
          notes: string | null
          outgoing_land_id: string | null
          outgoing_property_id: string | null
          outgoing_value: number
          party_id: string
          society_id: string
          status: Database["public"]["Enums"]["land_exchange_status"]
          token_amount: number
          updated_at: string
        }
        Insert: {
          agreement_terms?: string | null
          approved_at?: string | null
          approved_by?: string | null
          code?: string
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          difference_amount?: number
          id?: string
          incoming_area: number
          incoming_area_unit?: Database["public"]["Enums"]["area_unit"]
          incoming_description?: string | null
          incoming_khasra?: string | null
          incoming_khata?: string | null
          incoming_khewat?: string | null
          incoming_land_id?: string | null
          incoming_location?: string | null
          incoming_mouza?: string | null
          incoming_title: string
          incoming_value?: number
          notes?: string | null
          outgoing_land_id?: string | null
          outgoing_property_id?: string | null
          outgoing_value?: number
          party_id: string
          society_id: string
          status?: Database["public"]["Enums"]["land_exchange_status"]
          token_amount?: number
          updated_at?: string
        }
        Update: {
          agreement_terms?: string | null
          approved_at?: string | null
          approved_by?: string | null
          code?: string
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          difference_amount?: number
          id?: string
          incoming_area?: number
          incoming_area_unit?: Database["public"]["Enums"]["area_unit"]
          incoming_description?: string | null
          incoming_khasra?: string | null
          incoming_khata?: string | null
          incoming_khewat?: string | null
          incoming_land_id?: string | null
          incoming_location?: string | null
          incoming_mouza?: string | null
          incoming_title?: string
          incoming_value?: number
          notes?: string | null
          outgoing_land_id?: string | null
          outgoing_property_id?: string | null
          outgoing_value?: number
          party_id?: string
          society_id?: string
          status?: Database["public"]["Enums"]["land_exchange_status"]
          token_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "land_exchanges_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "land_exchanges_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "land_exchanges_incoming_land_id_fkey"
            columns: ["incoming_land_id"]
            isOneToOne: false
            referencedRelation: "land_parcels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "land_exchanges_outgoing_land_id_fkey"
            columns: ["outgoing_land_id"]
            isOneToOne: false
            referencedRelation: "land_parcels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "land_exchanges_outgoing_property_id_fkey"
            columns: ["outgoing_property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "land_exchanges_party_id_fkey"
            columns: ["party_id"]
            isOneToOne: false
            referencedRelation: "parties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "land_exchanges_society_id_fkey"
            columns: ["society_id"]
            isOneToOne: false
            referencedRelation: "societies"
            referencedColumns: ["id"]
          },
        ]
      }
      land_parcels: {
        Row: {
          acquisition_type: Database["public"]["Enums"]["land_acquisition_type"]
          agreement_terms: string | null
          approved_at: string | null
          approved_by: string | null
          area: number
          area_unit: Database["public"]["Enums"]["area_unit"]
          code: string
          created_at: string
          created_by: string | null
          description: string | null
          exchange_id: string | null
          id: string
          khasra: string | null
          khata: string | null
          khewat: string | null
          latitude: number | null
          location: string | null
          longitude: number | null
          mouza: string | null
          notes: string | null
          paid_amount: number
          party_id: string | null
          property_id: string | null
          purchase_value: number
          rate_per_unit: number
          remaining_amount: number
          society_id: string
          status: Database["public"]["Enums"]["land_status"]
          title: string
          token_amount: number
          updated_at: string
        }
        Insert: {
          acquisition_type?: Database["public"]["Enums"]["land_acquisition_type"]
          agreement_terms?: string | null
          approved_at?: string | null
          approved_by?: string | null
          area: number
          area_unit?: Database["public"]["Enums"]["area_unit"]
          code?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          exchange_id?: string | null
          id?: string
          khasra?: string | null
          khata?: string | null
          khewat?: string | null
          latitude?: number | null
          location?: string | null
          longitude?: number | null
          mouza?: string | null
          notes?: string | null
          paid_amount?: number
          party_id?: string | null
          property_id?: string | null
          purchase_value: number
          rate_per_unit?: number
          remaining_amount?: number
          society_id: string
          status?: Database["public"]["Enums"]["land_status"]
          title: string
          token_amount?: number
          updated_at?: string
        }
        Update: {
          acquisition_type?: Database["public"]["Enums"]["land_acquisition_type"]
          agreement_terms?: string | null
          approved_at?: string | null
          approved_by?: string | null
          area?: number
          area_unit?: Database["public"]["Enums"]["area_unit"]
          code?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          exchange_id?: string | null
          id?: string
          khasra?: string | null
          khata?: string | null
          khewat?: string | null
          latitude?: number | null
          location?: string | null
          longitude?: number | null
          mouza?: string | null
          notes?: string | null
          paid_amount?: number
          party_id?: string | null
          property_id?: string | null
          purchase_value?: number
          rate_per_unit?: number
          remaining_amount?: number
          society_id?: string
          status?: Database["public"]["Enums"]["land_status"]
          title?: string
          token_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "land_parcels_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "land_parcels_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "land_parcels_exchange_id_fkey"
            columns: ["exchange_id"]
            isOneToOne: false
            referencedRelation: "land_exchanges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "land_parcels_party_id_fkey"
            columns: ["party_id"]
            isOneToOne: false
            referencedRelation: "parties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "land_parcels_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "land_parcels_society_id_fkey"
            columns: ["society_id"]
            isOneToOne: false
            referencedRelation: "societies"
            referencedColumns: ["id"]
          },
        ]
      }
      land_payments: {
        Row: {
          amount: number
          cash_account_id: string
          code: string
          created_at: string
          entered_by: string | null
          id: string
          land_parcel_id: string
          notes: string | null
          party_id: string | null
          payment_date: string
          payment_mode: Database["public"]["Enums"]["payment_mode"]
          reference_no: string | null
        }
        Insert: {
          amount: number
          cash_account_id: string
          code?: string
          created_at?: string
          entered_by?: string | null
          id?: string
          land_parcel_id: string
          notes?: string | null
          party_id?: string | null
          payment_date?: string
          payment_mode?: Database["public"]["Enums"]["payment_mode"]
          reference_no?: string | null
        }
        Update: {
          amount?: number
          cash_account_id?: string
          code?: string
          created_at?: string
          entered_by?: string | null
          id?: string
          land_parcel_id?: string
          notes?: string | null
          party_id?: string | null
          payment_date?: string
          payment_mode?: Database["public"]["Enums"]["payment_mode"]
          reference_no?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "land_payments_cash_account_id_fkey"
            columns: ["cash_account_id"]
            isOneToOne: false
            referencedRelation: "cash_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "land_payments_entered_by_fkey"
            columns: ["entered_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "land_payments_land_parcel_id_fkey"
            columns: ["land_parcel_id"]
            isOneToOne: false
            referencedRelation: "land_parcels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "land_payments_party_id_fkey"
            columns: ["party_id"]
            isOneToOne: false
            referencedRelation: "parties"
            referencedColumns: ["id"]
          },
        ]
      }
      parties: {
        Row: {
          address: string | null
          code: string
          created_at: string
          created_by: string | null
          id: string
          id_number: string | null
          name: string
          notes: string | null
          opening_balance: number
          party_type: Database["public"]["Enums"]["party_type"]
          phone: string
          phone_secondary: string | null
          status: Database["public"]["Enums"]["party_status"]
          updated_at: string
        }
        Insert: {
          address?: string | null
          code?: string
          created_at?: string
          created_by?: string | null
          id?: string
          id_number?: string | null
          name: string
          notes?: string | null
          opening_balance?: number
          party_type?: Database["public"]["Enums"]["party_type"]
          phone: string
          phone_secondary?: string | null
          status?: Database["public"]["Enums"]["party_status"]
          updated_at?: string
        }
        Update: {
          address?: string | null
          code?: string
          created_at?: string
          created_by?: string | null
          id?: string
          id_number?: string | null
          name?: string
          notes?: string | null
          opening_balance?: number
          party_type?: Database["public"]["Enums"]["party_type"]
          phone?: string
          phone_secondary?: string | null
          status?: Database["public"]["Enums"]["party_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "parties_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      party_bank_details: {
        Row: {
          account_no: string | null
          account_title: string | null
          bank_name: string | null
          iban: string | null
          party_id: string
          updated_at: string
        }
        Insert: {
          account_no?: string | null
          account_title?: string | null
          bank_name?: string | null
          iban?: string | null
          party_id: string
          updated_at?: string
        }
        Update: {
          account_no?: string | null
          account_title?: string | null
          bank_name?: string | null
          iban?: string | null
          party_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "party_bank_details_party_id_fkey"
            columns: ["party_id"]
            isOneToOne: true
            referencedRelation: "parties"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string
          id: string
          is_active: boolean
          phone: string | null
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          full_name?: string
          id: string
          is_active?: boolean
          phone?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          is_active?: boolean
          phone?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Relationships: []
      }
      properties: {
        Row: {
          agent_notes: string | null
          agent_visible: boolean
          area: number
          area_unit: Database["public"]["Enums"]["area_unit"]
          asking_price: number | null
          attributes: string[]
          block_id: string | null
          code: string
          commission_type: Database["public"]["Enums"]["commission_type"] | null
          commission_value: number | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          facing: string | null
          hold_party_name: string | null
          hold_reason: string | null
          hold_until: string | null
          id: string
          internal_notes: string | null
          length_ft: number | null
          monthly_rent: number | null
          ownership_source: Database["public"]["Enums"]["ownership_source"]
          plot_no: string
          property_type: Database["public"]["Enums"]["property_type"]
          security_deposit: number | null
          society_id: string
          status: Database["public"]["Enums"]["property_status"]
          street_width_ft: number | null
          updated_at: string
          width_ft: number | null
        }
        Insert: {
          agent_notes?: string | null
          agent_visible?: boolean
          area: number
          area_unit?: Database["public"]["Enums"]["area_unit"]
          asking_price?: number | null
          attributes?: string[]
          block_id?: string | null
          code?: string
          commission_type?:
            | Database["public"]["Enums"]["commission_type"]
            | null
          commission_value?: number | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          facing?: string | null
          hold_party_name?: string | null
          hold_reason?: string | null
          hold_until?: string | null
          id?: string
          internal_notes?: string | null
          length_ft?: number | null
          monthly_rent?: number | null
          ownership_source?: Database["public"]["Enums"]["ownership_source"]
          plot_no: string
          property_type?: Database["public"]["Enums"]["property_type"]
          security_deposit?: number | null
          society_id: string
          status?: Database["public"]["Enums"]["property_status"]
          street_width_ft?: number | null
          updated_at?: string
          width_ft?: number | null
        }
        Update: {
          agent_notes?: string | null
          agent_visible?: boolean
          area?: number
          area_unit?: Database["public"]["Enums"]["area_unit"]
          asking_price?: number | null
          attributes?: string[]
          block_id?: string | null
          code?: string
          commission_type?:
            | Database["public"]["Enums"]["commission_type"]
            | null
          commission_value?: number | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          facing?: string | null
          hold_party_name?: string | null
          hold_reason?: string | null
          hold_until?: string | null
          id?: string
          internal_notes?: string | null
          length_ft?: number | null
          monthly_rent?: number | null
          ownership_source?: Database["public"]["Enums"]["ownership_source"]
          plot_no?: string
          property_type?: Database["public"]["Enums"]["property_type"]
          security_deposit?: number | null
          society_id?: string
          status?: Database["public"]["Enums"]["property_status"]
          street_width_ft?: number | null
          updated_at?: string
          width_ft?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "properties_block_id_fkey"
            columns: ["block_id"]
            isOneToOne: false
            referencedRelation: "society_blocks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "properties_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "properties_society_id_fkey"
            columns: ["society_id"]
            isOneToOne: false
            referencedRelation: "societies"
            referencedColumns: ["id"]
          },
        ]
      }
      property_costs: {
        Row: {
          acquisition_cost: number | null
          min_approved_price: number | null
          property_id: string
          updated_at: string
        }
        Insert: {
          acquisition_cost?: number | null
          min_approved_price?: number | null
          property_id: string
          updated_at?: string
        }
        Update: {
          acquisition_cost?: number | null
          min_approved_price?: number | null
          property_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_costs_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: true
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      property_status_history: {
        Row: {
          changed_at: string
          changed_by: string | null
          from_status: Database["public"]["Enums"]["property_status"] | null
          id: string
          property_id: string
          reason: string | null
          to_status: Database["public"]["Enums"]["property_status"]
        }
        Insert: {
          changed_at?: string
          changed_by?: string | null
          from_status?: Database["public"]["Enums"]["property_status"] | null
          id?: string
          property_id: string
          reason?: string | null
          to_status: Database["public"]["Enums"]["property_status"]
        }
        Update: {
          changed_at?: string
          changed_by?: string | null
          from_status?: Database["public"]["Enums"]["property_status"] | null
          id?: string
          property_id?: string
          reason?: string | null
          to_status?: Database["public"]["Enums"]["property_status"]
        }
        Relationships: [
          {
            foreignKeyName: "property_status_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_status_history_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      receipt_allocations: {
        Row: {
          allocated_amount: number
          created_at: string
          id: string
          installment_id: string
          receipt_id: string
        }
        Insert: {
          allocated_amount: number
          created_at?: string
          id?: string
          installment_id: string
          receipt_id: string
        }
        Update: {
          allocated_amount?: number
          created_at?: string
          id?: string
          installment_id?: string
          receipt_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "receipt_allocations_installment_id_fkey"
            columns: ["installment_id"]
            isOneToOne: false
            referencedRelation: "installments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receipt_allocations_receipt_id_fkey"
            columns: ["receipt_id"]
            isOneToOne: false
            referencedRelation: "receipts"
            referencedColumns: ["id"]
          },
        ]
      }
      receipts: {
        Row: {
          amount: number
          amount_in_words: string
          code: string
          created_at: string
          customer_id: string
          id: string
          notes: string | null
          payment_date: string
          payment_mode: Database["public"]["Enums"]["payment_mode"]
          received_by: string | null
          reference_no: string | null
          sale_id: string
        }
        Insert: {
          amount: number
          amount_in_words?: string
          code?: string
          created_at?: string
          customer_id: string
          id?: string
          notes?: string | null
          payment_date?: string
          payment_mode?: Database["public"]["Enums"]["payment_mode"]
          received_by?: string | null
          reference_no?: string | null
          sale_id: string
        }
        Update: {
          amount?: number
          amount_in_words?: string
          code?: string
          created_at?: string
          customer_id?: string
          id?: string
          notes?: string | null
          payment_date?: string
          payment_mode?: Database["public"]["Enums"]["payment_mode"]
          received_by?: string | null
          reference_no?: string | null
          sale_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "receipts_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receipts_received_by_fkey"
            columns: ["received_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receipts_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      sales: {
        Row: {
          agreement_date: string | null
          agreement_terms: string | null
          area: number
          area_unit: Database["public"]["Enums"]["area_unit"]
          code: string
          created_at: string
          created_by: string | null
          customer_id: string
          deleted_at: string | null
          id: string
          khata_no: string | null
          length_ft: number | null
          notes: string | null
          payment_type: Database["public"]["Enums"]["payment_type"]
          plot_no: string
          property_id: string
          property_type: Database["public"]["Enums"]["property_type"]
          purchaser_name: string | null
          rate_per_unit: number
          registry_no: string | null
          remaining_amount: number
          sale_amount: number
          seller_name: string | null
          society_id: string
          status: Database["public"]["Enums"]["sale_status"]
          term_months: number
          token_amount: number
          updated_at: string
          width_ft: number | null
        }
        Insert: {
          agreement_date?: string | null
          agreement_terms?: string | null
          area: number
          area_unit: Database["public"]["Enums"]["area_unit"]
          code?: string
          created_at?: string
          created_by?: string | null
          customer_id: string
          deleted_at?: string | null
          id?: string
          khata_no?: string | null
          length_ft?: number | null
          notes?: string | null
          payment_type?: Database["public"]["Enums"]["payment_type"]
          plot_no: string
          property_id: string
          property_type: Database["public"]["Enums"]["property_type"]
          purchaser_name?: string | null
          rate_per_unit: number
          registry_no?: string | null
          remaining_amount: number
          sale_amount: number
          seller_name?: string | null
          society_id: string
          status?: Database["public"]["Enums"]["sale_status"]
          term_months?: number
          token_amount?: number
          updated_at?: string
          width_ft?: number | null
        }
        Update: {
          agreement_date?: string | null
          agreement_terms?: string | null
          area?: number
          area_unit?: Database["public"]["Enums"]["area_unit"]
          code?: string
          created_at?: string
          created_by?: string | null
          customer_id?: string
          deleted_at?: string | null
          id?: string
          khata_no?: string | null
          length_ft?: number | null
          notes?: string | null
          payment_type?: Database["public"]["Enums"]["payment_type"]
          plot_no?: string
          property_id?: string
          property_type?: Database["public"]["Enums"]["property_type"]
          purchaser_name?: string | null
          rate_per_unit?: number
          registry_no?: string | null
          remaining_amount?: number
          sale_amount?: number
          seller_name?: string | null
          society_id?: string
          status?: Database["public"]["Enums"]["sale_status"]
          term_months?: number
          token_amount?: number
          updated_at?: string
          width_ft?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_society_id_fkey"
            columns: ["society_id"]
            isOneToOne: false
            referencedRelation: "societies"
            referencedColumns: ["id"]
          },
        ]
      }
      societies: {
        Row: {
          code: string
          created_at: string
          created_by: string | null
          currency: string
          default_area_unit: Database["public"]["Enums"]["area_unit"]
          deleted_at: string | null
          id: string
          location: string | null
          name: string
          notes: string | null
          status: Database["public"]["Enums"]["society_status"]
          updated_at: string
        }
        Insert: {
          code?: string
          created_at?: string
          created_by?: string | null
          currency?: string
          default_area_unit?: Database["public"]["Enums"]["area_unit"]
          deleted_at?: string | null
          id?: string
          location?: string | null
          name: string
          notes?: string | null
          status?: Database["public"]["Enums"]["society_status"]
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string | null
          currency?: string
          default_area_unit?: Database["public"]["Enums"]["area_unit"]
          deleted_at?: string | null
          id?: string
          location?: string | null
          name?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["society_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "societies_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      society_blocks: {
        Row: {
          created_at: string
          deleted_at: string | null
          id: string
          name: string
          notes: string | null
          phase: string | null
          society_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          name: string
          notes?: string | null
          phase?: string | null
          society_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          name?: string
          notes?: string | null
          phase?: string | null
          society_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "society_blocks_society_id_fkey"
            columns: ["society_id"]
            isOneToOne: false
            referencedRelation: "societies"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      app_role:
        | "super_admin"
        | "manager"
        | "accounts"
        | "sales"
        | "site_manager"
        | "inventory_manager"
        | "hr"
        | "agent"
        | "auditor"
      area_unit: "marla" | "kanal" | "acre" | "sq_ft" | "sq_yd"
      cash_account_type: "cash" | "bank"
      cash_category_type: "income" | "expense"
      cash_transaction_status: "posted" | "draft" | "reversed"
      cash_transaction_type: "income" | "expense" | "transfer" | "adjustment"
      cash_transfer_side: "in" | "out"
      commission_type: "percent" | "fixed"
      contract_status: "draft" | "active" | "completed" | "cancelled"
      contract_type:
        | "earth_filling"
        | "road"
        | "sewerage_labour"
        | "sewerage_material"
        | "building_labour"
        | "building_material"
        | "interior"
        | "wapda"
        | "other"
      contract_unit:
        | "foot"
        | "sq_ft"
        | "trailer"
        | "dumper"
        | "daily"
        | "pipe"
        | "lump_sum"
        | "other"
      customer_relation: "s_o" | "w_o" | "d_o" | "c_o" | "other"
      customer_source: "walk_in" | "referral" | "agent" | "campaign" | "other"
      customer_stage:
        | "lead"
        | "negotiation"
        | "booked"
        | "agreement_pending"
        | "active_emi"
        | "fully_paid"
        | "registry_pending"
        | "closed"
        | "cancelled"
      document_entity:
        | "customer"
        | "sale"
        | "property"
        | "party"
        | "contract"
        | "receipt"
        | "cash_transaction"
        | "society"
        | "land_parcel"
        | "land_exchange"
      document_status:
        | "draft"
        | "submitted"
        | "approved"
        | "rejected"
        | "replaced"
      document_type:
        | "agreement"
        | "e_stamp"
        | "registry"
        | "identity"
        | "payment_proof"
        | "invoice"
        | "receipt"
        | "quotation"
        | "work_order"
        | "title"
        | "agent_agreement"
        | "other"
      id_document_type: "cnic" | "passport" | "other"
      installment_status:
        | "upcoming"
        | "due"
        | "partially_paid"
        | "paid"
        | "overdue"
        | "waived"
        | "rescheduled"
      land_acquisition_type: "purchase" | "exchange_in" | "society_owned"
      land_exchange_status:
        | "draft"
        | "pending_approval"
        | "approved"
        | "completed"
        | "cancelled"
      land_status:
        | "proposed"
        | "under_negotiation"
        | "approved"
        | "partially_paid"
        | "fully_paid"
        | "transferred"
      ownership_source:
        | "society_owned"
        | "acquired"
        | "exchanged"
        | "third_party_listing"
      party_status: "active" | "inactive" | "blacklisted" | "completed"
      party_type:
        | "landlord"
        | "contractor"
        | "subcontractor"
        | "supplier"
        | "utility"
        | "other"
      payment_mode: "cash" | "bank_transfer" | "cheque" | "other"
      payment_type: "cash" | "emi" | "conditional"
      property_status:
        | "available"
        | "hold"
        | "booked"
        | "sold"
        | "rented"
        | "transferred"
        | "blocked"
      property_type:
        | "residential_plot"
        | "commercial_plot"
        | "agricultural_land"
        | "shop"
        | "house"
        | "office"
        | "other"
      sale_status:
        | "hold"
        | "booked"
        | "agreement_pending"
        | "active_emi"
        | "fully_paid"
        | "registry_pending"
        | "closed"
        | "cancelled"
      society_status: "planning" | "active" | "completed" | "closed"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"]

export type AppRole = Database["public"]["Enums"]["app_role"]
export type SocietyStatus = Database["public"]["Enums"]["society_status"]
export type AreaUnit = Database["public"]["Enums"]["area_unit"]
export type PropertyStatus = Database["public"]["Enums"]["property_status"]
export type PropertyType = Database["public"]["Enums"]["property_type"]
export type OwnershipSource = Database["public"]["Enums"]["ownership_source"]
export type Profile = Tables<"profiles">
export type Society = Tables<"societies">
export type SocietyBlock = Tables<"society_blocks">
export type Property = Tables<"properties">
export type PropertyCost = Tables<"property_costs">
export type PropertyStatusHistory = Tables<"property_status_history">
export type Customer = Tables<"customers">
export type Sale = Tables<"sales">
export type Installment = Tables<"installments">
export type CashAccount = Tables<"cash_accounts">
export type CashCategory = Tables<"cash_categories">
export type CashTransaction = Tables<"cash_transactions">
export type CustomerStage = Database["public"]["Enums"]["customer_stage"]
export type SaleStatus = Database["public"]["Enums"]["sale_status"]
export type PaymentType = Database["public"]["Enums"]["payment_type"]
export type InstallmentStatus = Database["public"]["Enums"]["installment_status"]
export type PaymentMode = Database["public"]["Enums"]["payment_mode"]
export type CashAccountType = Database["public"]["Enums"]["cash_account_type"]
export type CashCategoryType = Database["public"]["Enums"]["cash_category_type"]
export type CashTransactionType = Database["public"]["Enums"]["cash_transaction_type"]
export type CashTransactionStatus = Database["public"]["Enums"]["cash_transaction_status"]
export type CashTransferSide = Database["public"]["Enums"]["cash_transfer_side"]
export type Receipt = Tables<"receipts">
export type ReceiptAllocation = Tables<"receipt_allocations">
export type Party = Tables<"parties">
export type PartyBankDetails = Tables<"party_bank_details">
export type Contract = Tables<"contracts">
export type ContractPayment = Tables<"contract_payments">
export type PartyType = Database["public"]["Enums"]["party_type"]
export type PartyStatus = Database["public"]["Enums"]["party_status"]
export type ContractType = Database["public"]["Enums"]["contract_type"]
export type ContractStatus = Database["public"]["Enums"]["contract_status"]
export type ContractUnit = Database["public"]["Enums"]["contract_unit"]
export type Document = Tables<"documents">
export type DocumentType = Database["public"]["Enums"]["document_type"]
export type DocumentStatus = Database["public"]["Enums"]["document_status"]
export type DocumentEntity = Database["public"]["Enums"]["document_entity"]
export type LandParcel = Tables<"land_parcels">
export type LandPayment = Tables<"land_payments">
export type LandExchange = Tables<"land_exchanges">
export type LandStatus = Database["public"]["Enums"]["land_status"]
export type LandAcquisitionType = Database["public"]["Enums"]["land_acquisition_type"]
export type LandExchangeStatus = Database["public"]["Enums"]["land_exchange_status"]
