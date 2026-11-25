import React from 'react';
import { AlertTriangle, ArrowRight, Plus, RotateCcw, Trash2 } from 'lucide-react';
import { MovieExpression } from '../types';
import { validateExpressions } from '../utils/expressions';

interface Step1ExpressionsProps {
  expressions: MovieExpression[];
  onChange: (next: MovieExpression[]) => void;
  onResetSample: () => void;
  onNext: () => void;
}

export const Step1Expressions: React.FC<Step1ExpressionsProps> = ({
  expressions,
  onChange,
  onResetSample,
  onNext,
}) => {
  const validation = validateExpressions(expressions);

  const handleFieldChange = (
    id: string,
    field: keyof Omit<MovieExpression, 'id'>,
    value: string
  ) => {
    onChange(expressions.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
  };

  const handleAddRow = () => {
    onChange([
      ...expressions,
      {
        id: `exp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        expression: '',
        koreanMeaning: '',
        movie: '',
      },
    ]);
  };

  const handleRemoveRow = (id: string) => {
    if (expressions.length <= 1) return;
    onChange(expressions.filter((item) => item.id !== id));
  };

  return (
    <section className="space-y-6">
      {/* Header & Summary */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-2 max-w-2xl">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1E292B]">
            Collect Your Movie Expressions
          </h1>
          <p className="text-base sm:text-lg text-[#4F5D61] leading-relaxed">
            Enter at least 5 English expressions from 2 or more movies. We will weave every phrase
            into your 30-second exam-night short film.
          </p>
        </div>

        <div className="flex items-center gap-4 text-sm text-[#4F5D61] shrink-0">
          <span className="font-mono-tabular font-medium text-[#1E292B]">
            {validation.validCount} / 5+ expressions
          </span>
          <span aria-hidden="true">·</span>
          <span className="font-mono-tabular font-medium text-[#1E292B]">
            {validation.distinctMovies.length} {validation.distinctMovies.length === 1 ? 'movie' : 'movies'}
          </span>
        </div>
      </div>

      {/* Required Validation Warning when <5 expressions or only 1 movie */}
      {!validation.isValid && (
        <div
          role="alert"
          className="bg-[#FFF8EB] border border-[#E7C684] rounded-2xl p-4 sm:p-5 flex items-start gap-3.5 text-[#6D4813]"
        >
          <AlertTriangle className="w-6 h-6 shrink-0 mt-0.5 text-[#B45309]" />
          <div className="space-y-1">
            <p className="font-semibold text-base text-[#57370A]">
              More details needed before building your film
            </p>
            <ul className="space-y-1 text-base">
              {validation.warnings.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Expression Rows */}
      <div className="space-y-4">
        {expressions.map((item, idx) => (
          <div
            key={item.id}
            className="bg-white border border-[#E3E6E1] rounded-2xl p-4 sm:p-5 space-y-4"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-semibold text-[#4F5D61] font-mono-tabular">
                Expression {String(idx + 1).padStart(2, '0')}
              </span>
              <button
                type="button"
                onClick={() => handleRemoveRow(item.id)}
                disabled={expressions.length <= 1}
                aria-label={`Remove expression ${idx + 1}`}
                className="min-h-[44px] min-w-[44px] px-3 rounded-xl text-sm font-medium text-[#556367] hover:text-[#9F3A3A] hover:bg-[#FDF2F2] disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span className="hidden sm:inline">Remove</span>
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              <div className="lg:col-span-5 space-y-1.5">
                <label
                  htmlFor={`expr-${item.id}`}
                  className="block text-sm font-semibold text-[#2E3C40]"
                >
                  English Expression
                </label>
                <input
                  id={`expr-${item.id}`}
                  type="text"
                  value={item.expression}
                  onChange={(e) => handleFieldChange(item.id, 'expression', e.target.value)}
                  placeholder="e.g. keep it together"
                  className="w-full min-h-[48px] px-4 py-2.5 rounded-xl bg-[#F8F9F7] border border-[#D7DDD6] focus:border-[#3B5B6D] focus:bg-white focus:outline-none text-base text-[#1E292B]"
                />
              </div>

              <div className="lg:col-span-4 space-y-1.5">
                <label
                  htmlFor={`meaning-${item.id}`}
                  className="block text-sm font-semibold text-[#2E3C40]"
                >
                  Korean Meaning (한국어 뜻)
                </label>
                <input
                  id={`meaning-${item.id}`}
                  type="text"
                  value={item.koreanMeaning}
                  onChange={(e) => handleFieldChange(item.id, 'koreanMeaning', e.target.value)}
                  placeholder="예: 침착함을 유지하다"
                  className="w-full min-h-[48px] px-4 py-2.5 rounded-xl bg-[#F8F9F7] border border-[#D7DDD6] focus:border-[#3B5B6D] focus:bg-white focus:outline-none text-base text-[#1E292B]"
                />
              </div>

              <div className="lg:col-span-3 space-y-1.5">
                <label
                  htmlFor={`movie-${item.id}`}
                  className="block text-sm font-semibold text-[#2E3C40]"
                >
                  Source Movie
                </label>
                <input
                  id={`movie-${item.id}`}
                  type="text"
                  value={item.movie}
                  onChange={(e) => handleFieldChange(item.id, 'movie', e.target.value)}
                  placeholder="e.g. Inside Out 2"
                  className="w-full min-h-[48px] px-4 py-2.5 rounded-xl bg-[#F8F9F7] border border-[#D7DDD6] focus:border-[#3B5B6D] focus:bg-white focus:outline-none text-base text-[#1E292B]"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Action Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleAddRow}
            className="min-h-[52px] px-5 py-3 rounded-xl bg-white border border-[#D5DBD4] hover:bg-[#F1F4F0] text-[#1E292B] font-semibold text-base flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Plus className="w-5 h-5" />
            <span>Add Expression</span>
          </button>

          <button
            type="button"
            onClick={onResetSample}
            className="min-h-[52px] px-5 py-3 rounded-xl bg-[#EFF2EE] hover:bg-[#E3E8E1] text-[#354448] font-medium text-base flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Load Exam Sample</span>
          </button>
        </div>

        <button
          type="button"
          onClick={onNext}
          className="min-h-[54px] px-7 py-3.5 rounded-xl bg-[#3B5B6D] hover:bg-[#304B5A] text-white font-semibold text-base flex items-center justify-center gap-2.5 transition-colors cursor-pointer shadow-sm"
        >
          <span>Next: Set Scene & Style</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </section>
  );
};
