import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  adminGetMenu,
  adminCreateMenuItem,
  adminUpdateMenuItem,
} from "@/api/client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { isAdminUiA, isAdminUiB, isAdminUiC, isAdminUiD } from "@/config/adminUiVariant";

function TextInput(props) {
  return (
    <input
      {...props}
      className={
        "w-full rounded border px-2 py-1 text-sm " + (props.className || "")
      }
    />
  );
}

function CheckboxInput(props) {
  return <input type="checkbox" {...props} className="h-4 w-4" />;
}

function TextInputB(props) {
  return (
    <input
      {...props}
      className={
        "w-full rounded-lg border border-[#FDE68A] bg-white px-3 py-1.5 text-sm text-[#1C1917] placeholder:text-gray-400 focus:outline-none focus:ring-[#F59E0B]/30 focus:border-[#F59E0B] transition " +
        (props.className || "")
      }
    />
  );
}

function CheckboxInputB(props) {
  return (
    <input
      type="checkbox"
      {...props}
      className="h-4 w-4 rounded border-[#E5E7EB] text-[#FACC15] focus:ring-[#FACC15]"
    />
  );
}

function TextInputDark(props) {
  return (
    <input
      {...props}
      className={
        "w-full rounded-lg border border-[#1E293B] bg-[#111827] px-3 py-1.5 text-sm text-[#E5E7EB] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/30 focus:border-[#3B82F6] transition"
      }
    />
  );
}

function CheckboxInputDark(props) {
  return (
    <input
      type="checkbox"
      {...props}
      className="h-4 w-4 rounded border-[#1E293B] text-[#3B82F6] focus:ring-[#3B82F6]"
    />
  );
}

function TextInputC(props) {
  return (
    <input
      {...props}
      className={
        "w-full rounded-lg border border-[#BBF7D0] bg-white px-3 py-1.5 text-sm text-[#052E16] placeholder:text-[#052E16]/50 focus:outline-none focus:ring-2 focus:ring-[#22C55E]/30 focus:border-[#22C55E] transition " +
        (props.className || "")
      }
    />
  );
}

function CheckboxInputC(props) {
  return (
    <input
      type="checkbox"
      {...props}
      className="h-4 w-4 rounded border-[#BBF7D0] text-[#22C55E] focus:ring-[#22C55E]"
    />
  );
}

export default function AdminPizzasPage() {
  const qc = useQueryClient();
  const isA = isAdminUiA();
  const isB = isAdminUiB();
  const isC = isAdminUiC();
  const isD = isAdminUiD();

  const {
    data: items,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["admin-menu"],
    queryFn: adminGetMenu,
  });

  const [editRows, setEditRows] = useState({}); 

  const setRowField = (id, field, value) => {
    setEditRows((prev) => ({
      ...prev,
      [id]: { ...(prev[id] || {}), [field]: value },
    }));
  };

  const updateMut = useMutation({
    mutationFn: ({ id, payload }) => adminUpdateMenuItem(id, payload),
    onSuccess: () => {
      qc.invalidateQueries(["admin-menu"]);
    },
  });

  const initialNewItem = {
    name: "",
    description: "",
    price: "",
    is_active: true,
  };
  const [newItem, setNewItem] = useState(initialNewItem);

  const createMut = useMutation({
    mutationFn: (payload) => adminCreateMenuItem(payload),
    onSuccess: () => {
      qc.invalidateQueries(["admin-menu"]);
      setNewItem(initialNewItem);
    },
  });

  const handleSaveRow = (item) => {
    const row = editRows[item.id] || {};
    const payload = {
      name: row.name ?? item.name,
      description: row.description ?? item.description,
      price: Number(row.price ?? item.price),
      is_active:
        typeof row.is_active === "boolean" ? row.is_active : item.is_active,
    };

    updateMut.mutate({ id: item.id, payload });
  };

  const handleCreate = (e) => {
    e.preventDefault();
    if (!newItem.name || !newItem.price) return;

    createMut.mutate({
      name: newItem.name,
      description: newItem.description || null,
      price: Number(newItem.price),
      is_active: !!newItem.is_active,
    });
  };

  if (isLoading) {
    return <div className="text-gray-600">Загружаем позиции меню…</div>;
  }

  if (error) {
    return (
      <div className="text-red-600">
        Не удалось загрузить меню: {error.message}
      </div>
    );
  }

  if (isA || isD) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold text-[#1C1917]">Пиццы / меню</h1>

        <div className="overflow-x-auto rounded-xl border border-[#FDE68A] bg-white">
          <table className="min-w-full text-sm text-[#1C1917]">
            <thead>
              <tr className="border-b border-[#FDE68A] bg-[#FFFBEB]">
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#78350F] uppercase tracking-wider">ID</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">ID пиццы</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Название</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Описание</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Цена</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Активна</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#FDE68A]">
              {items?.map((item) => {
                const row = editRows[item.id] || {};
                return (
                  <tr key={item.id} className="hover:bg-[#FFFBEB] transition-colors">
                    <td className="px-4 py-3 text-[#92400E] font-mono text-xs">{item.id}</td>
                    <td className="px-4 py-3 text-[#92400E] font-mono text-xs">
                      {item.pizza_id}
                    </td>
                    <td className="px-4 py-3">
                      <TextInputB
                        value={row.name ?? item.name ?? ""}
                        onChange={(e) => setRowField(item.id, "name", e.target.value)}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <TextInputB
                        value={row.description ?? item.description ?? ""}
                        onChange={(e) =>
                          setRowField(item.id, "description", e.target.value)
                        }
                      />
                    </td>
                    <td className="px-4 py-3 w-28">
                      <TextInputB
                        type="number"
                        step="10"
                        value={row.price ?? item.price ?? ""}
                        onChange={(e) =>
                          setRowField(item.id, "price", e.target.value)
                        }
                      />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <CheckboxInputB
                        checked={
                          typeof row.is_active === "boolean"
                            ? row.is_active
                            : item.is_active
                        }
                        onChange={(e) =>
                          setRowField(item.id, "is_active", e.target.checked)
                        }
                      />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        size="sm"
                        className="text-xs bg-[#3B82F6] hover:bg-[#2563EB] text-[#E5E7EB]"
                        disabled={updateMut.isPending}
                        onClick={() => handleSaveRow(item)}
                      >
                        Сохранить
                      </Button>
                    </td>
                  </tr>
                );
              })}

              {!items?.length && (
                <tr>
                  <td className="px-4 py-8 text-center text-gray-500" colSpan={7}>
                    Пока нет позиций меню.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="max-w-xl rounded-xl border border-[#FDE68A] bg-white p-6 space-y-4 text-[#1C1917]">
          <h2 className="text-lg font-semibold">Добавить пиццу</h2>
          <form className="space-y-4" onSubmit={handleCreate}>
            <div>
              <label className="block text-xs font-medium text-[#92400E] mb-1.5">
                Название
              </label>
              <TextInputB
                value={newItem.name}
                onChange={(e) =>
                  setNewItem((p) => ({ ...p, name: e.target.value }))
                }
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#92400E] mb-1.5">
                Описание
              </label>
              <TextInputB
                value={newItem.description}
                onChange={(e) =>
                  setNewItem((p) => ({ ...p, description: e.target.value }))
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4 items-end">
              <div>
                <label className="block text-xs font-medium text-[#92400E] mb-1.5">
                  Цена
                </label>
                <TextInputB
                  type="number"
                  step="10"
                  value={newItem.price}
                  onChange={(e) =>
                    setNewItem((p) => ({ ...p, price: e.target.value }))
                  }
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-[#78350F] pb-1">
                <CheckboxInputB
                  checked={newItem.is_active}
                  onChange={(e) =>
                    setNewItem((p) => ({ ...p, is_active: e.target.checked }))
                  }
                />
                Активна (наличие)
              </label>
            </div>

            <Button
              type="submit"
              className="bg-[#F59E0B] hover:bg-[#D97706] text-white font-semibold"
              disabled={createMut.isPending}
            >
              <Plus size={16} className="mr-1.5" />
              Добавить пиццу
            </Button>
          </form>
        </div>
      </div>
    );
  }

  if (isC) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold text-[#052E16]">Пиццы / меню</h1>

        <div className="overflow-x-auto rounded-xl border border-[#BBF7D0] bg-white">
          <table className="min-w-full text-sm text-[#052E16]">
            <thead>
                <tr className="border-b border-[#BBF7D0] bg-[#F0FDF4]">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                  ID
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                  ID пиццы
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                  Название
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                  Описание
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                  Цена
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                  Активна
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#BBF7D0]">
              {items?.map((item) => {
                const row = editRows[item.id] || {};
                return (
                  <tr key={item.id} className="hover:bg-[#E8F5E9] transition-colors">
                    <td className="px-4 py-3 text-[#052E16] font-mono text-xs">
                      {item.id}
                    </td>
                    <td className="px-4 py-3 text-[#052E16] font-mono text-xs">
                      {item.pizza_id}
                    </td>
                    <td className="px-4 py-3">
                      <TextInputC
                        value={row.name ?? item.name ?? ""}
                        onChange={(e) => setRowField(item.id, "name", e.target.value)}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <TextInputC
                        value={row.description ?? item.description ?? ""}
                        onChange={(e) =>
                          setRowField(item.id, "description", e.target.value)
                        }
                      />
                    </td>
                    <td className="px-4 py-3 w-28">
                      <TextInputC
                        type="number"
                        step="10"
                        value={row.price ?? item.price ?? ""}
                        onChange={(e) =>
                          setRowField(item.id, "price", e.target.value)
                        }
                      />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <CheckboxInputC
                        checked={
                          typeof row.is_active === "boolean"
                            ? row.is_active
                            : item.is_active
                        }
                        onChange={(e) =>
                          setRowField(item.id, "is_active", e.target.checked)
                        }
                      />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        size="sm"
                        className="text-xs bg-[#22C55E] hover:bg-[#16A34A] text-[#052E16] font-semibold"
                        disabled={updateMut.isPending}
                        onClick={() => handleSaveRow(item)}
                      >
                        Сохранить
                      </Button>
                    </td>
                  </tr>
                );
              })}

              {!items?.length && (
                <tr>
                  <td
                    className="px-4 py-8 text-center text-[#052E16]/50"
                    colSpan={7}
                  >
                    Пока нет позиций меню.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="max-w-xl rounded-xl border border-[#BBF7D0] bg-white p-6 space-y-4 text-[#052E16]">
          <h2 className="text-lg font-semibold">Добавить пиццу</h2>
          <form className="space-y-4" onSubmit={handleCreate}>
            <div>
              <label className="block text-xs font-medium text-[#052E16]/70 mb-1.5">
                Название
              </label>
              <TextInputC
                value={newItem.name}
                onChange={(e) => setNewItem((p) => ({ ...p, name: e.target.value }))}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#052E16]/70 mb-1.5">
                Описание
              </label>
              <TextInputC
                value={newItem.description}
                onChange={(e) =>
                  setNewItem((p) => ({ ...p, description: e.target.value }))
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4 items-end">
              <div>
                <label className="block text-xs font-medium text-[#052E16]/70 mb-1.5">
                  Цена
                </label>
                <TextInputC
                  type="number"
                  step="10"
                  value={newItem.price}
                  onChange={(e) => setNewItem((p) => ({ ...p, price: e.target.value }))}
                />
              </div>

              <label className="flex items-center gap-2 text-sm text-[#052E16] pb-1">
                <CheckboxInputC
                  checked={newItem.is_active}
                  onChange={(e) =>
                    setNewItem((p) => ({ ...p, is_active: e.target.checked }))
                  }
                />
                Активна (наличие)
              </label>
            </div>

            <Button
              type="submit"
              className="bg-[#22C55E] hover:bg-[#16A34A] text-[#052E16] font-semibold"
              disabled={createMut.isPending}
            >
              <Plus size={16} className="mr-1.5" />
              Добавить пиццу
            </Button>
          </form>
        </div>
      </div>
    );
  }

  if (isB) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold text-[#E5E7EB]">Пиццы / меню</h1>

        <div className="overflow-x-auto rounded-xl border border-[#1E293B] bg-[#111827]">
          <table className="min-w-full text-sm">
            <thead className="bg-[#111827]">
              <tr>
                <th className="px-3 py-2 text-left text-[#E5E7EB]/70">ID</th>
                <th className="px-3 py-2 text-left text-[#E5E7EB]/70">ID пиццы</th>
                <th className="px-3 py-2 text-left text-[#E5E7EB]/70">Название</th>
                <th className="px-3 py-2 text-left text-[#E5E7EB]/70">Описание</th>
                <th className="px-3 py-2 text-left text-[#E5E7EB]/70">Цена</th>
                <th className="px-3 py-2 text-left text-[#E5E7EB]/70">Активна</th>
                <th className="px-3 py-2 text-right text-[#E5E7EB]/70">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E293B]">
              {items?.map((item) => {
                const row = editRows[item.id] || {};
                return (
                  <tr key={item.id} className="border-t border-[#1E293B]">
                    <td className="px-3 py-2 text-[#E5E7EB]">{item.id}</td>
                    <td className="px-3 py-2 text-[#E5E7EB]">{item.pizza_id}</td>
                    <td className="px-3 py-2">
                      <TextInputDark
                        value={row.name ?? item.name ?? ""}
                        onChange={(e) => setRowField(item.id, "name", e.target.value)}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <TextInputDark
                        value={row.description ?? item.description ?? ""}
                        onChange={(e) =>
                          setRowField(item.id, "description", e.target.value)
                        }
                      />
                    </td>
                    <td className="px-3 py-2 w-24">
                      <TextInputDark
                        type="number"
                        step="10"
                        value={row.price ?? item.price ?? ""}
                        onChange={(e) => setRowField(item.id, "price", e.target.value)}
                      />
                    </td>
                    <td className="px-3 py-2 text-center">
                      <CheckboxInputDark
                        checked={
                          typeof row.is_active === "boolean"
                            ? row.is_active
                            : item.is_active
                        }
                        onChange={(e) =>
                          setRowField(item.id, "is_active", e.target.checked)
                        }
                      />
                    </td>
                    <td className="px-3 py-2 text-right">
                      <Button
                        size="sm"
                        className="text-xs bg-[#3B82F6] hover:bg-[#2563EB] text-[#E5E7EB] font-semibold"
                        disabled={updateMut.isPending}
                        onClick={() => handleSaveRow(item)}
                      >
                        Сохранить
                      </Button>
                    </td>
                  </tr>
                );
              })}

              {!items?.length && (
                <tr>
                  <td className="px-3 py-6 text-center text-[#94A3B8]" colSpan={7}>
                    Пока нет позиций меню.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="max-w-xl rounded-xl border border-[#1E293B] bg-[#111827] p-6 space-y-4 text-[#E5E7EB]">
          <h2 className="text-lg font-semibold">Добавить пиццу</h2>
          <form className="space-y-4" onSubmit={handleCreate}>
            <div>
              <label className="block text-xs font-medium text-[#94A3B8] mb-1.5">
                Название
              </label>
              <TextInputDark
                value={newItem.name}
                onChange={(e) => setNewItem((p) => ({ ...p, name: e.target.value }))}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#94A3B8] mb-1.5">
                Описание
              </label>
              <TextInputDark
                value={newItem.description}
                onChange={(e) =>
                  setNewItem((p) => ({ ...p, description: e.target.value }))
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4 items-end">
              <div>
                <label className="block text-xs font-medium text-[#94A3B8] mb-1.5">
                  Цена
                </label>
                <TextInputDark
                  type="number"
                  step="10"
                  value={newItem.price}
                  onChange={(e) => setNewItem((p) => ({ ...p, price: e.target.value }))}
                />
              </div>

              <label className="flex items-center gap-2 text-sm text-[#E5E7EB] pb-1">
                <CheckboxInputDark
                  checked={newItem.is_active}
                  onChange={(e) =>
                    setNewItem((p) => ({ ...p, is_active: e.target.checked }))
                  }
                />
                Активна (наличие)
              </label>
            </div>

            <Button
              type="submit"
              className="bg-[#3B82F6] hover:bg-[#2563EB] text-[#E5E7EB] font-semibold"
              disabled={createMut.isPending}
            >
              <Plus size={16} className="mr-1.5" />
              Добавить пиццу
            </Button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Пиццы / меню</h1>

      <div className="overflow-x-auto rounded-xl border bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left">ID</th>
              <th className="px-3 py-2 text-left">ID пиццы</th>
              <th className="px-3 py-2 text-left">Название</th>
              <th className="px-3 py-2 text-left">Описание</th>
              <th className="px-3 py-2 text-left">Цена</th>
              <th className="px-3 py-2 text-left">Активна</th>
              <th className="px-3 py-2 text-right">Действия</th>
            </tr>
          </thead>
          <tbody>
            {items?.map((item) => {
              const row = editRows[item.id] || {};
              return (
                <tr key={item.id} className="border-t">
                  <td className="px-3 py-2 text-gray-500">{item.id}</td>
                  <td className="px-3 py-2 text-gray-500">
                    {item.pizza_id}
                  </td>
                  <td className="px-3 py-2">
                    <TextInput
                      value={row.name ?? item.name ?? ""}
                      onChange={(e) =>
                        setRowField(item.id, "name", e.target.value)
                      }
                    />
                  </td>
                  <td className="px-3 py-2">
                    <TextInput
                      value={row.description ?? item.description ?? ""}
                      onChange={(e) =>
                        setRowField(item.id, "description", e.target.value)
                      }
                    />
                  </td>
                  <td className="px-3 py-2 w-24">
                    <TextInput
                      type="number"
                      step="10"
                      value={row.price ?? item.price ?? ""}
                      onChange={(e) =>
                        setRowField(item.id, "price", e.target.value)
                      }
                    />
                  </td>
                  <td className="px-3 py-2 text-center">
                    <CheckboxInput
                      checked={
                        typeof row.is_active === "boolean"
                          ? row.is_active
                          : item.is_active
                      }
                      onChange={(e) =>
                        setRowField(item.id, "is_active", e.target.checked)
                      }
                    />
                  </td>
                  <td className="px-3 py-2 text-right">
                    <Button
                      size="sm"
                      className="text-xs"
                      disabled={updateMut.isPending}
                      onClick={() => handleSaveRow(item)}
                    >
                      Сохранить
                    </Button>
                  </td>
                </tr>
              );
            })}

            {!items?.length && (
              <tr>
                <td
                  className="px-3 py-4 text-center text-gray-500"
                  colSpan={7}
                >
                  Пока нет позиций меню.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="max-w-xl rounded-xl border bg-white p-4 space-y-3">
        <h2 className="text-lg font-semibold">Добавить пиццу</h2>
        <form className="space-y-3" onSubmit={handleCreate}>
          <div>
            <div className="text-xs mb-1 text-gray-600">Название</div>
            <TextInput
              value={newItem.name}
              onChange={(e) =>
                setNewItem((p) => ({ ...p, name: e.target.value }))
              }
            />
          </div>

          <div>
            <div className="text-xs mb-1 text-gray-600">Описание</div>
            <TextInput
              value={newItem.description}
              onChange={(e) =>
                setNewItem((p) => ({ ...p, description: e.target.value }))
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-3 items-center">
            <div>
              <div className="text-xs mb-1 text-gray-600">Цена</div>
              <TextInput
                type="number"
                step="10"
                value={newItem.price}
                onChange={(e) =>
                  setNewItem((p) => ({ ...p, price: e.target.value }))
                }
              />
            </div>
            <label className="flex items-center gap-2 text-sm mt-4">
              <CheckboxInput
                checked={newItem.is_active}
                onChange={(e) =>
                  setNewItem((p) => ({
                    ...p,
                    is_active: e.target.checked,
                  }))
                }
              />
              Активна (наличие)
            </label>
          </div>

          <Button type="submit" className="mt-2" disabled={createMut.isPending}>
            Добавить пиццу
          </Button>
        </form>
      </div>
    </div>
  );
}
