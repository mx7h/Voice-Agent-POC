import { useState, useMemo } from "react";
import { Plus } from "lucide-react";
import toast from "react-hot-toast";
import type { MenuItem, ModifierGroup, ModifierOption, SelectedModifier } from "@/types";
import { formatCurrency } from "@/utils/format";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { addToCart } from "@/redux/slices/cartSlice";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

// Generate a random 24-char hex string that passes Mongoose ObjectId validation
const generateObjectId = () => {
  return Array.from({ length: 24 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
};

interface ModifierGroupProps {
  group: ModifierGroup;
  selections: SelectedModifier[];
  onToggle: (option: ModifierOption, group: ModifierGroup, checked: boolean) => void;
  // Submodifier props
  subSelections: SelectedModifier[];
}

function ModifierGroupSelector({ group, selections, onToggle, subSelections }: ModifierGroupProps) {
  const selectedOptions = selections.filter((s) => s.groupName === group.name);
  const minSel = group.minSelection ?? (group.required ? 1 : 0);
  const maxSel = group.maxSelection ?? (group.multiple ? Infinity : 1);
  const isMultiple = group.multiple || maxSel > 1;

  return (
    <div className="rounded-lg border border-border bg-muted/40 p-3 space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-foreground">
          {group.name}
          {group.required && (
            <span className="ml-1 text-xs text-red-500 font-normal">(Required)</span>
          )}
        </p>
        <span className="text-[11px] text-muted-foreground">
          {minSel === maxSel ? `Select ${minSel}` : `Select up to ${maxSel}`}
        </span>
      </div>

      <div className="space-y-2.5">
        {group.options.map((option) => {
          const isSelected = selectedOptions.some((s) => s.optionName === option.name);
          const reachedMax = selectedOptions.length >= maxSel;
          const isDisabled = !isSelected && reachedMax;

          const handleToggle = (checked: boolean) => {
            if (checked && reachedMax) {
              if (maxSel === 1 && selectedOptions.length > 0) {
                // Auto deselect the other selected option for single-select radio-like groups
                const previousSelectedOptionName = selectedOptions[0].optionName;
                const previousOption = group.options.find(
                  (o) => o.name === previousSelectedOptionName,
                );
                if (previousOption) {
                  onToggle(previousOption, group, false);
                }
              } else {
                return;
              }
            }
            onToggle(option, group, checked);
          };

          return (
            <div key={option.name} className="space-y-2">
              <label
                className={`flex items-center justify-between rounded-md border p-2 text-xs transition cursor-pointer ${
                  isSelected
                    ? "border-primary bg-primary/5 font-medium"
                    : "border-border hover:bg-accent/50"
                } ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <div className="flex items-center gap-2">
                  <input
                    type={isMultiple ? "checkbox" : "radio"}
                    name={group.name}
                    checked={isSelected}
                    disabled={isDisabled}
                    onChange={(e) => handleToggle(e.target.checked)}
                    className="h-3.5 w-3.5 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                  />
                  <span>{option.name}</span>
                </div>
                {option.price > 0 && (
                  <span className="text-muted-foreground">+{formatCurrency(option.price)}</span>
                )}
              </label>

              {/* Recursive rendering of nested groups (submodifiers) if option is selected */}
              {isSelected && option.modifierGroups && option.modifierGroups.length > 0 && (
                <div className="ml-4 pl-3 border-l border-border space-y-3 pt-1">
                  {option.modifierGroups.map((subGroup) => (
                    <ModifierGroupSelector
                      key={subGroup.name}
                      group={subGroup}
                      selections={selections}
                      onToggle={onToggle}
                      subSelections={subSelections}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function MenuItemCard({ item }: { item: MenuItem }) {
  const dispatch = useAppDispatch();
  const sessionId = useAppSelector((s) => s.session.sessionId);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selections, setSelections] = useState<SelectedModifier[]>([]);
  const disabled = item.available === false || !sessionId;

  const hasModifiers = item.modifierGroups && item.modifierGroups.length > 0;

  const handleToggleOption = (option: ModifierOption, group: ModifierGroup, checked: boolean) => {
    if (checked) {
      // Add the selection
      const newSelection: SelectedModifier = {
        modifierOptionId: generateObjectId(),
        groupName: group.name,
        optionName: option.name,
        price: option.price,
      };
      setSelections((prev) => [...prev, newSelection]);
    } else {
      // Deselecting option: remove it AND any nested selections within its submodifier groups
      const collectOptionNamesToDeselect = (opt: ModifierOption): string[] => {
        let names = [opt.name];
        if (opt.modifierGroups) {
          for (const subG of opt.modifierGroups) {
            for (const subO of subG.options) {
              names = [...names, ...collectOptionNamesToDeselect(subO)];
            }
          }
        }
        return names;
      };

      const namesToDeselect = collectOptionNamesToDeselect(option);
      setSelections((prev) => prev.filter((s) => !namesToDeselect.includes(s.optionName)));
    }
  };

  // Find all currently visible modifier groups (including active submodifier groups)
  const visibleGroups = useMemo(() => {
    const groups: ModifierGroup[] = [];

    const traverse = (grp: ModifierGroup) => {
      groups.push(grp);
      // For each option in this group, check if it's selected and has sub-groups
      const selectedOptionNames = selections
        .filter((s) => s.groupName === grp.name)
        .map((s) => s.optionName);

      for (const opt of grp.options) {
        if (selectedOptionNames.includes(opt.name) && opt.modifierGroups) {
          opt.modifierGroups.forEach(traverse);
        }
      }
    };

    if (item.modifierGroups) {
      item.modifierGroups.forEach(traverse);
    }
    return groups;
  }, [item.modifierGroups, selections]);

  // Validate constraint satisfaction for all currently visible groups
  const isValid = useMemo(() => {
    return visibleGroups.every((group) => {
      const selectedCount = selections.filter((s) => s.groupName === group.name).length;
      const minSel = group.minSelection ?? (group.required ? 1 : 0);
      const maxSel = group.maxSelection ?? (group.multiple ? Infinity : 1);
      return selectedCount >= minSel && selectedCount <= maxSel;
    });
  }, [visibleGroups, selections]);

  const totalPrice = useMemo(() => {
    const modifiersTotal = selections.reduce((sum, s) => sum + s.price, 0);
    return item.basePrice + modifiersTotal;
  }, [item.basePrice, selections]);

  const onAdd = async () => {
    if (!sessionId) return;
    try {
      await dispatch(
        addToCart({
          sessionId,
          menuId: item._id,
          quantity: 1,
          selectedModifiers: selections,
        }),
      ).unwrap();
      toast.success(`${item.name} added`);
      setDialogOpen(false);
      setSelections([]); // Reset selections on success
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to add");
    }
  };

  const handleOpenClick = () => {
    if (hasModifiers) {
      setSelections([]);
      setDialogOpen(true);
    } else {
      onAdd();
    }
  };

  return (
    <>
      <div className="flex items-start justify-between gap-3 rounded-lg border border-border bg-card p-3">
        <div className="min-w-0">
          <p className="truncate font-medium">{item.name}</p>
          {item.description && (
            <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{item.description}</p>
          )}
          <p className="mt-1 text-sm font-semibold">
            {formatCurrency(item.basePrice)}
            {hasModifiers && (
              <span className="ml-1 text-xs font-normal text-muted-foreground">(Customizable)</span>
            )}
          </p>
        </div>
        <button
          onClick={handleOpenClick}
          disabled={disabled}
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground disabled:opacity-40"
          aria-label={`Add ${item.name}`}
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {hasModifiers && (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-md w-full overflow-hidden flex flex-col p-0">
            <DialogHeader className="p-4 border-b border-border">
              <DialogTitle className="text-base font-semibold">Customize {item.name}</DialogTitle>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[60vh]">
              {item.modifierGroups?.map((group) => (
                <ModifierGroupSelector
                  key={group.name}
                  group={group}
                  selections={selections}
                  onToggle={handleToggleOption}
                  subSelections={selections}
                />
              ))}
            </div>

            <DialogFooter className="p-4 border-t border-border bg-muted/20 flex items-center justify-between gap-4">
              <div className="text-left">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                  Total Price
                </p>
                <p className="text-base font-bold text-foreground">{formatCurrency(totalPrice)}</p>
              </div>
              <button
                onClick={onAdd}
                disabled={!isValid}
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/95 disabled:opacity-50 transition cursor-pointer"
              >
                Add to Cart
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
