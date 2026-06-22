export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      supply_chain_paths: {
        Row: {
          id: string;
          name_key: string;
          description_key: string;
          market: string;
          path_type: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["supply_chain_paths"]["Row"],
          "created_at" | "updated_at"
        >;
        Update: Partial<Database["public"]["Tables"]["supply_chain_paths"]["Insert"]>;
      };
      path_nodes: {
        Row: {
          id: string;
          path_id: string;
          sequence: number;
          node_type: string;
          display_name: string;
          region: string | null;
          role_description: string | null;
          risk_level: string;
          status: string;
          notes: string | null;
          entity_name: string | null;
          document_completion: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["path_nodes"]["Row"],
          "created_at" | "updated_at"
        >;
        Update: Partial<Database["public"]["Tables"]["path_nodes"]["Insert"]>;
      };
      path_edges: {
        Row: {
          id: string;
          path_id: string;
          from_node_id: string;
          to_node_id: string;
          transport_mode: string;
          estimated_days: number;
          incoterms: string | null;
          checkpoint_description: string | null;
          required_documents: Json;
          risk_level: string;
          status: string;
          created_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["path_edges"]["Row"],
          "created_at"
        >;
        Update: Partial<Database["public"]["Tables"]["path_edges"]["Insert"]>;
      };
      documents: {
        Row: {
          id: string;
          doc_type: string;
          linked_node_id: string | null;
          linked_product: string;
          status: string;
          expiry_date: string | null;
          gap_note: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["documents"]["Row"],
          "created_at" | "updated_at"
        >;
        Update: Partial<Database["public"]["Tables"]["documents"]["Insert"]>;
      };
      regulatory_entries: {
        Row: {
          id: string;
          market: string;
          region: string;
          product: string;
          regulatory_body: string;
          classification: string;
          requirements: Json;
          risk_level: string;
          last_updated: string;
          source: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["regulatory_entries"]["Row"],
          "created_at" | "updated_at"
        >;
        Update: Partial<
          Database["public"]["Tables"]["regulatory_entries"]["Insert"]
        >;
      };
      alerts: {
        Row: {
          id: string;
          priority: string;
          title_key: string;
          summary_key: string;
          source: string;
          status: string;
          suggested_actions: Json;
          created_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["alerts"]["Row"],
          "created_at"
        >;
        Update: Partial<Database["public"]["Tables"]["alerts"]["Insert"]>;
      };
      entities: {
        Row: {
          id: string;
          type: string;
          name: string;
          country: string;
          region: string | null;
          contact: string;
          email: string;
          products: Json;
          cooperation_status: string;
          latest_quote: Json | null;
          risk_notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["entities"]["Row"],
          "created_at" | "updated_at"
        >;
        Update: Partial<Database["public"]["Tables"]["entities"]["Insert"]>;
      };
      agent_submissions: {
        Row: {
          id: string;
          author: string;
          content: string;
          status: string;
          proposed_changes: Json;
          created_at: string;
          committed_at: string | null;
        };
        Insert: {
          id?: string;
          author: string;
          content: string;
          status?: string;
          proposed_changes?: Json;
          committed_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["agent_submissions"]["Insert"]>;
      };
      activity_log: {
        Row: {
          id: string;
          action: string;
          entity_type: string;
          entity_id: string | null;
          payload: Json | null;
          actor: string;
          created_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["activity_log"]["Row"],
          "id" | "created_at"
        > & { id?: string };
        Update: Partial<Database["public"]["Tables"]["activity_log"]["Insert"]>;
      };
      risk_signals: {
        Row: {
          id: string;
          type: string;
          severity: string;
          title_key: string;
          body_key: string;
          affected_nodes: Json;
          status: string;
          created_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["risk_signals"]["Row"],
          "created_at"
        >;
        Update: Partial<Database["public"]["Tables"]["risk_signals"]["Insert"]>;
      };
      monitor_meta: {
        Row: {
          id: string;
          benchmark_date: string;
          platform_count: number;
          product_type_count: number;
          listing_count: number;
          source_files: Json;
          budget_split: Json;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["monitor_meta"]["Row"],
          "updated_at"
        >;
        Update: Partial<Database["public"]["Tables"]["monitor_meta"]["Insert"]>;
      };
      monitor_platforms: {
        Row: {
          id: string;
          name: string;
          sort_order: number;
        };
        Insert: Database["public"]["Tables"]["monitor_platforms"]["Row"];
        Update: Partial<Database["public"]["Tables"]["monitor_platforms"]["Insert"]>;
      };
      product_monitor_records: {
        Row: {
          id: string;
          product: string;
          display_name_zh: string | null;
          primary_spec: string;
          category: string;
          tier: string;
          tier_source: string;
          platform_coverage: number;
          platform_total: number;
          platform_presence: Json;
          platform_listings: Json;
          common_blends: Json;
          spec_profile: Json;
          supply_metrics: Json;
          au_regulatory_risk: string;
          regulatory_notes: Json;
          scores: Json;
          composite_score: number;
          stocking_logic: string;
          notes: string | null;
          last_reviewed: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["product_monitor_records"]["Row"],
          "created_at" | "updated_at"
        >;
        Update: Partial<
          Database["public"]["Tables"]["product_monitor_records"]["Insert"]
        >;
      };
      product_blends: {
        Row: {
          id: string;
          name: string;
          components: Json;
          platform_coverage: number;
          platform_total: number;
          tier: string;
          stock_mode: string;
        };
        Insert: Database["public"]["Tables"]["product_blends"]["Row"];
        Update: Partial<Database["public"]["Tables"]["product_blends"]["Insert"]>;
      };
      intelligence_signals: {
        Row: {
          id: string;
          source: string;
          title: string;
          summary: string;
          signal_date: string;
          region: string | null;
          products: Json;
          heat_impact: number | null;
          regulatory_impact: number | null;
          trend: string | null;
          url: string | null;
          created_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["intelligence_signals"]["Row"],
          "created_at"
        >;
        Update: Partial<
          Database["public"]["Tables"]["intelligence_signals"]["Insert"]
        >;
      };
      sku_opportunities: {
        Row: {
          id: string;
          product: string;
          demand_score: number;
          local_price: number;
          competitive_price: number;
          regulatory_sensitivity: number;
          opportunity_score: number;
          trend: string;
          sparkline: Json;
        };
        Insert: Database["public"]["Tables"]["sku_opportunities"]["Row"];
        Update: Partial<Database["public"]["Tables"]["sku_opportunities"]["Insert"]>;
      };
      sales_records: {
        Row: {
          id: string;
          sale_date: string;
          country: string;
          region: string;
          product: string;
          category: string;
          quantity: number;
          unit: string;
          revenue: number;
          currency: string;
        };
        Insert: Database["public"]["Tables"]["sales_records"]["Row"];
        Update: Partial<Database["public"]["Tables"]["sales_records"]["Insert"]>;
      };
      supplier_profiles: {
        Row: {
          id: string;
          name: string;
          contact: string;
          email: string;
          products: Json;
          price: number;
          unit: string;
          moq: string;
          documents: Json;
          country: string;
          region: string;
        };
        Insert: Database["public"]["Tables"]["supplier_profiles"]["Row"];
        Update: Partial<Database["public"]["Tables"]["supplier_profiles"]["Insert"]>;
      };
      customer_demands: {
        Row: {
          id: string;
          name: string;
          contact: string;
          email: string;
          product: string;
          quantity: string;
          target_price: number;
          price_unit: string;
          required_documents: Json;
          country: string;
          region: string;
          status: string;
        };
        Insert: Database["public"]["Tables"]["customer_demands"]["Row"];
        Update: Partial<Database["public"]["Tables"]["customer_demands"]["Insert"]>;
      };
      platform_config: {
        Row: {
          key: string;
          value: Json;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["platform_config"]["Row"],
          "updated_at"
        >;
        Update: Partial<Database["public"]["Tables"]["platform_config"]["Insert"]>;
      };
      regulatory_scans: {
        Row: {
          id: string;
          source: string;
          findings: Json;
          alerts_created: number;
          scanned_at: string;
        };
        Insert: {
          id?: string;
          source?: string;
          findings?: Json;
          alerts_created?: number;
          scanned_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["regulatory_scans"]["Insert"]
        >;
      };
    };
  };
}
