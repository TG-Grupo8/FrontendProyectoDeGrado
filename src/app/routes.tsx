import React from "react";
import { createBrowserRouter, Navigate } from "react-router";
import { Layout }               from "./components/Layout";
import { Login }                from "./pages/Login";
import { Register }             from "./pages/Register";
import { UploadArticle }        from "./pages/UploadArticle";
import { NLPResults }           from "./pages/NLPResults";
import { EntityValidation }     from "./pages/EntityValidation";
import { CompoundRelations }    from "./pages/CompoundRelations";
import { DiseaseRelations }     from "./pages/DiseaseRelations";
import { DataExplorer }         from "./pages/DataExplorer";
import { KnowledgeGraph }       from "./pages/KnowledgeGraph";
import { Historial }            from "./pages/Historial";
import { useAuth }              from "./context/AuthContext";

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export const router = createBrowserRouter([
  { path: "/", element: <Navigate to="/login" replace /> },
  { path: "/login",    Component: Login    },
  { path: "/register", Component: Register },
  {
    path: "/app",
    element: <RequireAuth><Layout /></RequireAuth>,
    children: [
      { index: true,                              Component: UploadArticle     },
      { path: "nlp-results",                      Component: NLPResults        },
      { path: "nlp-results/entities",             Component: EntityValidation  },
      { path: "nlp-results/compound-relations",   Component: CompoundRelations },
      { path: "nlp-results/disease-relations",    Component: DiseaseRelations  },
      { path: "data-explorer",                    Component: DataExplorer      },
      { path: "knowledge-graph",                  Component: KnowledgeGraph    },
      { path: "historial",                        Component: Historial         },
    ],
  },
]);