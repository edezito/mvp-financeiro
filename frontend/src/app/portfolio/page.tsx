"use client";

import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PortfolioSummary } from "@/components/portfolio/PortfolioSummary";
import { AssetTable } from "@/components/portfolio/AssetTable";
import { AssetForm } from "@/components/portfolio/AssetForm";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { usePortfolioStore } from "@/contexts/portfolioStore";
import { Plus, X } from "lucide-react";

export default function PortfolioPage() {
  const [showForm, setShowForm] = useState(false);
  const { fetchAssets } = usePortfolioStore();

  useEffect(() => {
    fetchAssets();
  }, []);

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Portfólio de Investimentos
            </h2>
            <p className="text-sm text-gray-500">
              Acompanhe seus ativos e preço médio
            </p>
          </div>
          <Button onClick={() => setShowForm((v) => !v)}>
            {showForm ? (
              <><X className="h-4 w-4" /> Fechar</>
            ) : (
              <><Plus className="h-4 w-4" /> Adicionar Ativo</>
            )}
          </Button>
        </div>

        {/* Cards de resumo */}
        <PortfolioSummary />

        {/* Formulário */}
        {showForm && (
          <Card>
            <h3 className="mb-5 text-sm font-semibold text-gray-700">
              Registrar compra / nota de corretagem
            </h3>
            <AssetForm onSuccess={() => setShowForm(false)} />
          </Card>
        )}

        {/* Tabela completa */}
        <Card>
          <h3 className="mb-5 text-sm font-semibold text-gray-700">
            Minha Carteira
          </h3>
          <AssetTable />
        </Card>
      </div>
    </AppLayout>
  );
}
