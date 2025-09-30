// src/MultimoneySystem.jsx - Componente Principal MULTIMONEY
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Upload, FileText, BarChart3, Calendar, Users, 
  Target, AlertTriangle, CheckCircle2, Download, 
  X, Filter, Search, RefreshCw, ExternalLink,
  TrendingUp, Clock, Globe, Briefcase,
  PieChart, Activity, FileSpreadsheet
} from 'lucide-react';
import { 
  PieChart as RechartsPie, 
  BarChart, 
  Bar, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer
} from 'recharts';

  // Importar utilidades (asegurándonos de que las rutas sean correctas)
import { processCSVWithFallback } from './utils/dataProcessing.js';
import { 
  SYSTEM_MODULES, 
  GITHUB_EXAMPLES, 
  CSV_VALIDATION, 
  REGIONS,
  STATE_COLORS,
  isCompleted,
  calculateRiskScore,
  getStateCategory 
} from './utils/constants.js';

// Componente de progreso de carga
const LoadingProgress = ({ progress = { phase: 'Iniciando...', percentage: 0 } }) => {
  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-center mb-4">
          <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 text-center mb-4">
          Procesando archivo CSV
        </h3>
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">{progress.phase}</span>
            <span className="text-gray-900 font-medium">{progress.percentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress.percentage}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// Componente principal
const MultimoneySystem = () => {
  // Estados principales - INICIALIZADOS CORRECTAMENTE
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState({ phase: 'Listo', percentage: 0 });
  const [activeModule, setActiveModule] = useState('dashboard');
  
  // Estados de filtros - INICIALIZADOS CON TODOS LOS FILTROS
  const [filters, setFilters] = useState({
    country: '',
    epic: '',
    area: '',
    state: '',
    priority: '',
    completedSince: null,
    timelineSince: null
  });

  // Estados para análisis avanzado
  const [selectedEpic, setSelectedEpic] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  // Funciones de utilidad para módulos
  const getStateColor = (state) => {
    const stateColorMap = {
      'Finalizado': '#10b981',
      'En Producción': '#059669', 
      'Done': '#34d399',
      'ANALISIS': '#3b82f6',
      'DEV': '#1d4ed8',
      'UAT': '#60a5fa',
      'En Proceso': '#2563eb',
      'En Progreso': '#3b82f6',
      'Aprobación': '#8b5cf6',
      'PRIORIZAR': '#f59e0b',
      'Ingreso': '#6b7280',
      'Por Hacer': '#9ca3af',
      'Bloqueado': '#ef4444',
      'Blocked': '#dc2626',
      'Cancelado': '#f87171',
      'Cancelled': '#ef4444'
    };
    return stateColorMap[state] || '#6b7280';
  };

  // ✅ INICIALIZAR CORRECTAMENTE githubExamples
  const githubExamples = useMemo(() => {
    return GITHUB_EXAMPLES || []; // Fallback a array vacío
  }, []);

  const systemModules = useMemo(() => {
    return SYSTEM_MODULES || []; // Fallback a array vacío
  }, []);

  // Función para cargar ejemplos de GitHub
  const handleLoadGitHubExample = useCallback(async (exampleUrl) => {
    setLoading(true);
    setError(null);
    setProgress({ phase: 'Descargando ejemplo de GitHub...', percentage: 10 });

    try {
      const response = await fetch(exampleUrl);
      if (!response.ok) {
        throw new Error(`Error al cargar ejemplo: ${response.status}`);
      }
      
      const csvText = await response.text();
      setProgress({ phase: 'Procesando ejemplo...', percentage: 50 });
      
      const result = await processCSVWithFallback(csvText, setProgress);
      
      setData(result.data);
      setProgress({ phase: 'Completado', percentage: 100 });
      
      setTimeout(() => {
        setLoading(false);
        setProgress({ phase: 'Listo', percentage: 0 });
      }, 1000);
      
    } catch (error) {
      console.error('Error cargando ejemplo:', error);
      setError(`Error cargando ejemplo: ${error.message}`);
      setLoading(false);
      setProgress({ phase: 'Error', percentage: 0 });
    }
  }, []);

  // Función para manejar carga de archivos
  const handleFileUpload = useCallback(async (file) => {
    if (!file) return;

    setLoading(true);
    setError(null);
    setProgress({ phase: 'Leyendo archivo...', percentage: 5 });

    try {
      const csvText = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(new Error('Error leyendo archivo'));
        reader.readAsText(file);
      });

      const result = await processCSVWithFallback(csvText, setProgress);
      
      setData(result.data);
      setProgress({ phase: 'Completado', percentage: 100 });
      
      setTimeout(() => {
        setLoading(false);
        setProgress({ phase: 'Listo', percentage: 0 });
      }, 1000);
      
    } catch (error) {
      console.error('Error procesando archivo:', error);
      setError(error.message);
      setLoading(false);
      setProgress({ phase: 'Error', percentage: 0 });
    }
  }, []);

  // Drag & Drop handlers
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    const csvFile = files.find(file => file.type === 'text/csv' || file.name.endsWith('.csv'));
    
    if (csvFile) {
      handleFileUpload(csvFile);
    } else {
      setError('Por favor, sube un archivo CSV válido');
    }
  }, [handleFileUpload]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
  }, []);

  // Obtener opciones únicas para filtros - SIMPLIFICADO PARA DEBUGGING
  const filterOptions = useMemo(() => {
    if (!data || data.length === 0) return { countries: [], epics: [], areas: [], states: [], priorities: [] };
    
    // Debug completo: mostrar estructura de datos
    console.log('🔍 DEBUG: Estructura completa del primer elemento:');
    console.log(JSON.stringify(data[0], null, 2));
    console.log('🔍 DEBUG: Todas las columnas disponibles:');
    console.log(Object.keys(data[0] || {}));
    console.log('🔍 DEBUG: Total elementos en data:', data.length);
    
    // Extraer valores EXACTOS sin validación para ver qué contienen
    const rawCountries = data.map(item => item.PAIS_BM).filter(val => val !== undefined && val !== null && val !== '');
    const rawEpics = data.map(item => item.Epica).filter(val => val !== undefined && val !== null && val !== '');
    const rawAreas = data.map(item => item['Area responsable']).filter(val => val !== undefined && val !== null && val !== '');
    const rawStates = data.map(item => item.Estado).filter(val => val !== undefined && val !== null && val !== '');
    const rawPriorities = data.map(item => item.Prioridad).filter(val => val !== undefined && val !== null && val !== '');
    
    console.log('🔍 DEBUG: Muestra de datos RAW:');
    console.log('- Países (primeros 10):', rawCountries.slice(0, 10));
    console.log('- Épicas (primeras 5):', rawEpics.slice(0, 5));
    console.log('- Áreas (primeras 5):', rawAreas.slice(0, 5));
    console.log('- Estados (primeros 10):', rawStates.slice(0, 10));
    console.log('- Prioridades (primeras 10):', rawPriorities.slice(0, 10));
    
    return {
      // Sin filtrado, solo valores únicos directos
      countries: [...new Set(rawCountries)].sort(),
      epics: [...new Set(rawEpics)].sort(),
      areas: [...new Set(rawAreas)].sort(),
      states: [...new Set(rawStates)].sort(),
      priorities: [...new Set(rawPriorities)].sort()
    };
  }, [data]);

  // Filtrar datos según filtros activos - CON LÓGICA DE ESTADOS AGRUPADOS
  const filteredData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    return data.filter(item => {
      // Filtro de país - usar nombre exacto de columna
      if (filters.country && (item.PAIS_BM || item['PAIS_BM']) !== filters.country) return false;
      
      // Filtro de épica - usar nombre exacto
      if (filters.epic && (item.Epica || item['Epica']) !== filters.epic) return false;
      
      // Filtro de área - verificar ambas versiones posibles
      if (filters.area && (item['Area responsable'] || item['Área Responsable']) !== filters.area) return false;
      
      // Filtro de estado AGRUPADO
      if (filters.state) {
        const stateCategory = getStateCategory(item.Estado);
        
        if (filters.state === 'finalizados') {
          // Solo proyectos completados
          if (!isCompleted(item.Estado)) return false;
        } else if (filters.state === 'activos') {
          // Solo proyectos activos (excluir completados)
          if (isCompleted(item.Estado)) return false;
        }
      }
      
      // Filtro de prioridad
      if (filters.priority && (item.Prioridad || item['Prioridad']) !== filters.priority) return false;
      
      return true;
    });
  }, [data, filters]);

  // Componente de filtros generales - Como en la imagen
  const GeneralFilters = () => {
    const clearFilter = (filterKey) => {
      setFilters(prev => ({ ...prev, [filterKey]: '' }));
    };

    const clearAllFilters = () => {
      setFilters({
        country: '',
        epic: '',
        area: '',
        state: '',
        priority: '',
        completedSince: null,
        timelineSince: null
      });
    };

    const activeFiltersCount = Object.values(filters).filter(value => value && value !== '').length;

    return (
      <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Filtros Generales</h3>
          <div className="flex items-center gap-2">
            {activeFiltersCount > 0 && (
              <span className="text-sm text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                {activeFiltersCount} activos
              </span>
            )}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              {showFilters ? 'Ocultar filtros' : 'Mostrar filtros'}
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {/* Filtro de País */}
            <div className="relative">
              <label className="block text-xs font-medium text-gray-700 mb-1">País</label>
              <select
                value={filters.country}
                onChange={(e) => setFilters(prev => ({ ...prev, country: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todos los países</option>
                {filterOptions.countries.map(country => (
                  <option key={country} value={country}>{country}</option>
                ))}
              </select>
              {filters.country && (
                <button
                  onClick={() => clearFilter('country')}
                  className="absolute right-8 top-7 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Filtro de Épica */}
            <div className="relative">
              <label className="block text-xs font-medium text-gray-700 mb-1">Épica</label>
              <select
                value={filters.epic}
                onChange={(e) => setFilters(prev => ({ ...prev, epic: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todas las épicas</option>
                {filterOptions.epics.map(epic => (
                  <option key={epic} value={epic}>{epic}</option>
                ))}
              </select>
              {filters.epic && (
                <button
                  onClick={() => clearFilter('epic')}
                  className="absolute right-8 top-7 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Filtro de Área */}
            <div className="relative">
              <label className="block text-xs font-medium text-gray-700 mb-1">Área</label>
              <select
                value={filters.area}
                onChange={(e) => setFilters(prev => ({ ...prev, area: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todas las áreas</option>
                {filterOptions.areas.map(area => (
                  <option key={area} value={area}>{area}</option>
                ))}
              </select>
              {filters.area && (
                <button
                  onClick={() => clearFilter('area')}
                  className="absolute right-8 top-7 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Filtro de Estado AGRUPADO - Como en la imagen */}
            <div className="relative">
              <label className="block text-xs font-medium text-gray-700 mb-1">Estado</label>
              <select
                value={filters.state}
                onChange={(e) => setFilters(prev => ({ ...prev, state: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todos los estados</option>
                <option value="finalizados">Solo Finalizados</option>
                <option value="activos">Solo Activos (En Proceso, Aprobación, Diseño, Priorizar, Backlog)</option>
              </select>
              {filters.state && (
                <button
                  onClick={() => clearFilter('state')}
                  className="absolute right-8 top-7 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Filtro de Prioridad */}
            <div className="relative">
              <label className="block text-xs font-medium text-gray-700 mb-1">Prioridad</label>
              <select
                value={filters.priority}
                onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todas las prioridades</option>
                {filterOptions.priorities.map(priority => (
                  <option key={priority} value={priority}>{priority}</option>
                ))}
              </select>
              {filters.priority && (
                <button
                  onClick={() => clearFilter('priority')}
                  className="absolute right-8 top-7 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Botón limpiar todos */}
            <div className="flex items-end">
              <button
                onClick={clearAllFilters}
                disabled={activeFiltersCount === 0}
                className="w-full px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Limpiar todos
              </button>
            </div>
          </div>
        )}

        {/* Tags de filtros activos */}
        {activeFiltersCount > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {filters.country && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                País: {filters.country}
                <button onClick={() => clearFilter('country')}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {filters.epic && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                Épica: {filters.epic.length > 20 ? filters.epic.substring(0, 20) + '...' : filters.epic}
                <button onClick={() => clearFilter('epic')}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {filters.area && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                Área: {filters.area}
                <button onClick={() => clearFilter('area')}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {filters.state && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
                Estado: {filters.state === 'finalizados' ? 'Solo Finalizados' : 
                        filters.state === 'activos' ? 'Solo Activos' : filters.state}
                <button onClick={() => clearFilter('state')}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {filters.priority && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                Prioridad: {filters.priority}
                <button onClick={() => clearFilter('priority')}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>
        )}
      </div>
    );
  };

  // Módulo Dashboard - VERSIÓN COMPLETA COMO LA IMAGEN
  const DashboardModule = () => {
    // Métricas principales mejoradas - CON AGRUPACIÓN DE ESTADOS RESTAURADA
    const metrics = useMemo(() => {
      const total = filteredData.length;
      
      // Usar la función normalizeState para agrupar estados similares
      const completed = filteredData.filter(item => isCompleted(item.Estado)).length;
      
      const inProgress = filteredData.filter(item => {
        const normalizedState = getStateCategory(item.Estado);
        return normalizedState === 'En Progreso';
      }).length;
      
      const approval = filteredData.filter(item => {
        const normalizedState = getStateCategory(item.Estado);
        return normalizedState === 'En Revisión';
      }).length;

      const created = filteredData.filter(item => {
        const normalizedState = getStateCategory(item.Estado);
        return normalizedState === 'Por Hacer';
      }).length;

      const blocked = filteredData.filter(item => {
        const normalizedState = getStateCategory(item.Estado);
        return normalizedState === 'Bloqueado';
      }).length;

      const cancelled = filteredData.filter(item => {
        const normalizedState = getStateCategory(item.Estado);
        return normalizedState === 'Cancelado';
      }).length;

      const overdue = filteredData.filter(item => {
        if (isCompleted(item.Estado)) return false;
        const dueDate = item['Fecha de vencimiento_parsed'];
        return dueDate && dueDate < new Date();
      }).length;

      const highPriority = filteredData.filter(item => {
        const priority = item.Prioridad?.toLowerCase() || '';
        return priority.includes('alta') || priority.includes('high') || 
               priority.includes('critica') || priority.includes('critical') ||
               priority === 'highest';
      }).length;

      const others = total - completed - inProgress - approval - created - blocked - cancelled;
      
      return { total, completed, inProgress, approval, created, blocked, overdue, highPriority, cancelled, others };
    }, [filteredData]);

    // Análisis por estados detallado - CON AGRUPACIÓN RESTAURADA
    const stateAnalysis = useMemo(() => {
      const stateCount = {};
      
      filteredData.forEach(item => {
        // Usar getStateCategory para agrupar estados similares
        const normalizedState = getStateCategory(item.Estado);
        const displayName = {
          'Por Hacer': 'Por Hacer',
          'En Progreso': 'En Progreso', 
          'En Revisión': 'En Revisión',
          'Bloqueado': 'Bloqueado',
          'Completado': 'Completado',
          'Cancelado': 'Cancelado'
        }[normalizedState] || normalizedState || 'Otro';
        
        stateCount[displayName] = (stateCount[displayName] || 0) + 1;
      });
      
      const colors = {
        'Por Hacer': '#9ca3af',
        'En Progreso': '#3b82f6',
        'En Revisión': '#f59e0b', 
        'Bloqueado': '#ef4444',
        'Completado': '#10b981',
        'Cancelado': '#f87171',
        'Otro': '#6b7280'
      };
      
      return Object.entries(stateCount)
        .map(([state, count]) => ({
          name: state,
          value: count,
          percentage: ((count / filteredData.length) * 100).toFixed(1),
          color: colors[state] || '#6b7280'
        }))
        .sort((a, b) => b.value - a.value);
    }, [filteredData]);

    // Matriz regional completa - CON AGRUPACIÓN DE ESTADOS RESTAURADA
    const regionalMatrix = useMemo(() => {
      const countries = ['Guatemala', 'Regional', 'Costa Rica', 'El Salvador', 'México', 'Akros', 'PEX'];
      const matrix = {};
      
      countries.forEach(country => {
        matrix[country] = {
          total: 0,
          finalizados: 0,
          enProceso: 0,
          aprobacion: 0,
          creada: 0,
          bloqueados: 0,
          cancelados: 0,
          otros: 0
        };
      });

      filteredData.forEach(item => {
        const country = item.PAIS_BM || 'Regional';
        const mappedCountry = {
          'GT': 'Guatemala',
          'RG': 'Regional', 
          'CR': 'Costa Rica',
          'SV': 'El Salvador',
          'MX': 'México'
        }[country] || country;

        if (matrix[mappedCountry]) {
          matrix[mappedCountry].total++;
          
          // Usar getStateCategory para agrupación consistente
          const normalizedState = getStateCategory(item.Estado);
          
          switch (normalizedState) {
            case 'Completado':
              matrix[mappedCountry].finalizados++;
              break;
            case 'En Progreso':
              matrix[mappedCountry].enProceso++;
              break;
            case 'En Revisión':
              matrix[mappedCountry].aprobacion++;
              break;
            case 'Por Hacer':
              matrix[mappedCountry].creada++;
              break;
            case 'Bloqueado':
              matrix[mappedCountry].bloqueados++;
              break;
            case 'Cancelado':
              matrix[mappedCountry].cancelados++;
              break;
            default:
              matrix[mappedCountry].otros++;
          }
        }
      });

      return matrix;
    }, [filteredData]);

    // Top 10 Épicas con análisis detallado
    const epicAnalysis = useMemo(() => {
      const epicStats = {};
      
      filteredData.forEach(item => {
        const epic = item.Epica || 'Sin Épica';
        if (!epicStats[epic]) {
          epicStats[epic] = {
            name: epic,
            total: 0,
            finalizados: 0,
            enProceso: 0,
            otros: 0
          };
        }
        
        epicStats[epic].total++;
        
        if (isCompleted(item.Estado)) {
          epicStats[epic].finalizados++;
        } else if (item.Estado?.toLowerCase().includes('proceso') || 
                   item.Estado?.toLowerCase().includes('progreso') ||
                   item.Estado?.toLowerCase().includes('desarrollo')) {
          epicStats[epic].enProceso++;
        } else {
          epicStats[epic].otros++;
        }
      });

      return Object.values(epicStats)
        .map(epic => ({
          ...epic,
          finalizadosPercent: epic.total > 0 ? (epic.finalizados / epic.total) * 100 : 0,
          enProcesoPercent: epic.total > 0 ? (epic.enProceso / epic.total) * 100 : 0,
          otrosPercent: epic.total > 0 ? (epic.otros / epic.total) * 100 : 0,
          completionRate: epic.total > 0 ? Math.round((epic.finalizados / epic.total) * 100) : 0
        }))
        .filter(epic => epic.total > 0)
        .sort((a, b) => b.total - a.total)
        .slice(0, 10);
    }, [filteredData]);

    return (
      <div className="space-y-6">
        {/* KPIs Grid - RESPONSIVE MEJORADO */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-10 gap-2 sm:gap-3 lg:gap-4">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-3 lg:p-4 rounded-xl text-center">
            <div className="text-lg lg:text-2xl font-bold">{metrics.total}</div>
            <div className="text-xs opacity-90">Total</div>
          </div>
          
          <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-3 lg:p-4 rounded-xl text-center">
            <div className="text-lg lg:text-2xl font-bold">{metrics.completed}</div>
            <div className="text-xs opacity-90">Finalizados</div>
          </div>
          
          <div className="bg-gradient-to-r from-blue-400 to-blue-500 text-white p-3 lg:p-4 rounded-xl text-center">
            <div className="text-lg lg:text-2xl font-bold">{metrics.inProgress}</div>
            <div className="text-xs opacity-90">En Proceso</div>
          </div>
          
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-3 lg:p-4 rounded-xl text-center">
            <div className="text-lg lg:text-2xl font-bold">{metrics.approval}</div>
            <div className="text-xs opacity-90">Aprobación</div>
          </div>
          
          <div className="bg-gradient-to-r from-gray-500 to-gray-600 text-white p-3 lg:p-4 rounded-xl text-center">
            <div className="text-lg lg:text-2xl font-bold">{metrics.created}</div>
            <div className="text-xs opacity-90">Creada</div>
          </div>
          
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-3 lg:p-4 rounded-xl text-center">
            <div className="text-lg lg:text-2xl font-bold">{metrics.blocked}</div>
            <div className="text-xs opacity-90">Bloqueados</div>
          </div>
          
          <div className="bg-gradient-to-r from-red-500 to-red-600 text-white p-3 lg:p-4 rounded-xl text-center">
            <div className="text-lg lg:text-2xl font-bold">{metrics.overdue}</div>
            <div className="text-xs opacity-90">Vencidos</div>
          </div>
          
          <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white p-3 lg:p-4 rounded-xl text-center">
            <div className="text-lg lg:text-2xl font-bold">{metrics.highPriority}</div>
            <div className="text-xs opacity-90">Alta Prioridad</div>
          </div>
          
          <div className="bg-gradient-to-r from-pink-500 to-pink-600 text-white p-3 lg:p-4 rounded-xl text-center">
            <div className="text-lg lg:text-2xl font-bold">{metrics.cancelled}</div>
            <div className="text-xs opacity-90">Cancelados</div>
          </div>
          
          <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white p-3 lg:p-4 rounded-xl text-center">
            <div className="text-lg lg:text-2xl font-bold">{metrics.others}</div>
            <div className="text-xs opacity-90">Otros</div>
          </div>
        </div>

        {/* LAYOUT RESPONSIVE MEJORADO */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Matriz Regional - RESPONSIVE */}
          <div className="bg-white rounded-xl shadow-lg p-4 lg:p-6 xl:col-span-2">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Matriz Regional</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs lg:text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 px-1 lg:px-2 font-medium text-gray-900">País</th>
                    <th className="text-center py-2 px-1 lg:px-2 font-medium text-gray-900">Total</th>
                    <th className="text-center py-2 px-1 lg:px-2 font-medium text-green-600">Finalizados</th>
                    <th className="text-center py-2 px-1 lg:px-2 font-medium text-blue-600">En Proceso</th>
                    <th className="text-center py-2 px-1 lg:px-2 font-medium text-purple-600">Aprobación</th>
                    <th className="text-center py-2 px-1 lg:px-2 font-medium text-gray-600">Creada</th>
                    <th className="text-center py-2 px-1 lg:px-2 font-medium text-orange-600">Bloqueados</th>
                    <th className="text-center py-2 px-1 lg:px-2 font-medium text-pink-600">Cancelados</th>
                    <th className="text-center py-2 px-1 lg:px-2 font-medium text-gray-500">Otros</th>
                    <th className="text-center py-2 px-1 lg:px-2 font-medium text-gray-900">% Completado</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(regionalMatrix)
                    .filter(([, data]) => data.total > 0)
                    .map(([country, data]) => (
                      <tr key={country} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-2 px-1 lg:px-2 font-medium">{country}</td>
                        <td className="text-center py-2 px-1 lg:px-2">{data.total}</td>
                        <td className="text-center py-2 px-1 lg:px-2 text-green-600">{data.finalizados}</td>
                        <td className="text-center py-2 px-1 lg:px-2 text-blue-600">{data.enProceso}</td>
                        <td className="text-center py-2 px-1 lg:px-2 text-purple-600">{data.aprobacion}</td>
                        <td className="text-center py-2 px-1 lg:px-2 text-gray-600">{data.creada}</td>
                        <td className="text-center py-2 px-1 lg:px-2 text-orange-600">{data.bloqueados}</td>
                        <td className="text-center py-2 px-1 lg:px-2 text-pink-600">{data.cancelados}</td>
                        <td className="text-center py-2 px-1 lg:px-2 text-gray-500">{data.otros}</td>
                        <td className="text-center py-2 px-1 lg:px-2">
                          <div className="flex items-center justify-center gap-1 lg:gap-2">
                            <div className="w-8 lg:w-12 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-green-500 h-2 rounded-full"
                                style={{ width: `${data.total > 0 ? (data.finalizados / data.total) * 100 : 0}%` }}
                              />
                            </div>
                            <span className="text-xs font-medium">
                              {data.total > 0 ? Math.round((data.finalizados / data.total) * 100) : 0}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Distribución por Estados - RESPONSIVE */}
        <div className="bg-white rounded-xl shadow-lg p-4 lg:p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Distribución por Estados</h3>
          <ResponsiveContainer width="100%" height={250}>
            <RechartsPie data={stateAnalysis} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              {stateAnalysis.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
              <Tooltip 
                formatter={(value, name) => [`${value} (${stateAnalysis.find(s => s.name === name)?.percentage}%)`, name]}
              />
              <Legend />
            </RechartsPie>
          </ResponsiveContainer>
        </div>

        {/* Top 10 Épicas - RESPONSIVE */}
        <div className="bg-white rounded-xl shadow-lg p-4 lg:p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Top 10 Épicas - Análisis Detallado</h3>
          <div className="space-y-4">
            {epicAnalysis.map((epic, index) => (
              <div key={index} className="border-b border-gray-100 pb-4 last:border-b-0">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-2">
                  <h4 className="font-medium text-gray-900 text-sm flex-1">
                    {index + 1}. {epic.name}
                  </h4>
                  <div className="text-right">
                    <span className="text-sm font-medium text-gray-900">{epic.completionRate}%</span>
                    <div className="text-xs text-gray-500">
                      {epic.finalizados} finalizados - {epic.enProceso} en proceso - {epic.otros} otros
                    </div>
                  </div>
                </div>
                
                {/* Barra de progreso horizontal RESPONSIVE */}
                <div className="w-full bg-gray-200 rounded-full h-5 lg:h-6 relative overflow-hidden">
                  <div 
                    className="absolute left-0 top-0 h-full bg-green-500 transition-all duration-300"
                    style={{ width: `${epic.finalizadosPercent}%` }}
                  />
                  <div 
                    className="absolute top-0 h-full bg-blue-500 transition-all duration-300"
                    style={{ 
                      left: `${epic.finalizadosPercent}%`,
                      width: `${epic.enProcesoPercent}%` 
                    }}
                  />
                  <div 
                    className="absolute top-0 h-full bg-gray-400 transition-all duration-300"
                    style={{ 
                      left: `${epic.finalizadosPercent + epic.enProcesoPercent}%`,
                      width: `${epic.otrosPercent}%` 
                    }}
                  />
                  
                  {/* Etiquetas dentro de la barra - RESPONSIVE */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-medium text-white mix-blend-difference">
                      {epic.total} tickets
                    </span>
                  </div>
                </div>
                
                {/* Leyenda pequeña - RESPONSIVE */}
                <div className="flex flex-wrap items-center gap-2 lg:gap-4 mt-2 text-xs text-gray-600">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-green-500 rounded"></div>
                    <span>Finalizados</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-blue-500 rounded"></div>
                    <span>En proceso</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-gray-400 rounded"></div>
                    <span>Otros</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Módulo de Riesgos (EXCLUYE finalizados)
  const RiesgosModule = () => {
    const riskProjects = useMemo(() => {
      return filteredData.filter(project => {
        // EXCLUIR finalizados como solicitaste
        if (isCompleted(project.Estado)) return false;
        
        const riskScore = calculateRiskScore(project);
        return riskScore > 0;
      }).map(project => ({
        ...project,
        riskScore: calculateRiskScore(project)
      })).sort((a, b) => b.riskScore - a.riskScore);
    }, [filteredData]);

    const riskStats = useMemo(() => {
      const high = riskProjects.filter(p => p.riskScore >= 7).length;
      const medium = riskProjects.filter(p => p.riskScore >= 4 && p.riskScore < 7).length;
      const low = riskProjects.filter(p => p.riskScore > 0 && p.riskScore < 4).length;
      
      return { high, medium, low, total: riskProjects.length };
    }, [riskProjects]);

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-r from-red-500 to-red-600 text-white p-4 rounded-xl">
            <div className="text-2xl font-bold">{riskStats.high}</div>
            <div className="text-sm opacity-90">Riesgo Alto</div>
          </div>
          <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white p-4 rounded-xl">
            <div className="text-2xl font-bold">{riskStats.medium}</div>
            <div className="text-sm opacity-90">Riesgo Medio</div>
          </div>
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-4 rounded-xl">
            <div className="text-2xl font-bold">{riskStats.low}</div>
            <div className="text-sm opacity-90">Riesgo Bajo</div>
          </div>
          <div className="bg-gradient-to-r from-gray-500 to-gray-600 text-white p-4 rounded-xl">
            <div className="text-2xl font-bold">{riskStats.total}</div>
            <div className="text-sm opacity-90">Total Riesgos</div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4">
            Proyectos de Riesgo (Excluye Finalizados) - {riskStats.total}
          </h3>
          
          {riskProjects.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-green-500" />
              <p>¡Excelente! No hay proyectos activos con riesgo detectado.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {riskProjects.slice(0, 20).map((project, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{project.Resumen}</h4>
                      <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                        <span>Estado: {project.Estado}</span>
                        {project.Epica && <span>Épica: {project.Epica}</span>}
                        {project.PAIS_BM && <span>País: {project.PAIS_BM}</span>}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-lg font-bold ${
                        project.riskScore >= 7 ? 'text-red-600' :
                        project.riskScore >= 4 ? 'text-yellow-600' : 'text-orange-600'
                      }`}>
                        {project.riskScore}
                      </div>
                      <div className="text-xs text-gray-500">Risk Score</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Renderizar área de carga - ✅ FUNCIÓN CORREGIDA
  const renderLoadingArea = () => {
    return (
      <div className="text-center py-12">
        <div className="max-w-2xl mx-auto">
          <FileSpreadsheet className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Cargar Datos de Jira</h2>
          <p className="text-gray-600 mb-8">
            Arrastra y suelta un archivo CSV exportado de Jira, o selecciona una opción
          </p>

          {/* Drag & Drop Area */}
          <div 
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 hover:border-gray-400 transition-colors cursor-pointer"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => document.getElementById('csvFile').click()}
          >
            <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-lg font-medium text-gray-700 mb-2">
              Seleccionar archivo CSV
            </p>
            <p className="text-sm text-gray-500">
              Formatos soportados: .csv (máximo {Math.round((CSV_VALIDATION?.max_file_size || 10485760) / 1048576)}MB)
            </p>
          </div>

          <input
            id="csvFile"
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => handleFileUpload(e.target.files[0])}
          />

          {/* Ejemplos de GitHub - ✅ ARRAY PROTEGIDO */}
          {githubExamples.length > 0 && (
            <>
              <div className="mt-8 mb-4">
                <p className="text-sm text-gray-500">O usa datos de ejemplo:</p>
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                {githubExamples.map((example, index) => (
                  <button
                    key={index}
                    onClick={() => handleLoadGitHubExample(example.url)}
                    className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors text-left"
                    disabled={loading}
                  >
                    <div className="font-medium text-gray-900 mb-1">
                      {example.name}
                    </div>
                    <div className="text-sm text-gray-600 mb-2">
                      {example.description}
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{example.region}</span>
                      <span>{example.size}</span>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  // Función para renderizar el módulo activo
  const renderActiveModule = () => {
    switch (activeModule) {
      case 'dashboard':
        return <DashboardModule />;
      case 'riesgos':
        return <RiesgosModule />;
      default:
        return (
          <div className="text-center py-8 text-gray-500">
            <p>Módulo "{activeModule}" en desarrollo</p>
          </div>
        );
    }
  };

  // Renderizado principal
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <LoadingProgress progress={progress} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">MM</span>
              </div>
              <h1 className="text-xl font-bold text-gray-900">MULTIMONEY</h1>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-gray-600">
              {data.length > 0 && (
                <>
                  <span>{data.length} proyectos</span>
                  <span>•</span>
                  <span>{filteredData.length} filtrados</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start">
              <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h3 className="font-medium text-red-800">Error</h3>
                <div className="mt-1 text-sm text-red-700 whitespace-pre-line">
                  {error}
                </div>
                <button
                  onClick={() => setError(null)}
                  className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}

        {data.length === 0 ? (
          renderLoadingArea()
        ) : (
          <>
            {/* Filtros Generales */}
            <GeneralFilters />

            {/* Navigation */}
            <div className="mb-6">
              <div className="flex flex-wrap gap-2">
                {systemModules.map((module) => (
                  <button
                    key={module.id}
                    onClick={() => setActiveModule(module.id)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      activeModule === module.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                    }`}
                  >
                    {module.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Module Content */}
            {renderActiveModule()}
          </>
        )}
      </div>
    </div>
  );
};

export default MultimoneySystem;